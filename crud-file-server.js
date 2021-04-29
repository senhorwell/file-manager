var fs = require('fs');

var cleanUrl = function(url) { 
	url = decodeURIComponent(url);
	while(url.indexOf('..') >= 0) { url = url.replace('..', ''); }
	return url;
};

exports.handleRequest = function(vpath, path, req, res, readOnly, logHeadRequests) {	

	var writeError = function (err, code) { 
		code = code || 500;
		console.log('Error ' + code + ': ' + err);

		try {			
			res.statusCode = code;
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(err));	
		} catch(resErr) {
			console.log('failed to write error to response: ' + resErr);
		}
	};

	if(path.lastIndexOf('/') !== path.length - 1) { path += '/'; }	
	var parsedUrl = require('url').parse(req.url);	
	var query = query ? {} : require('querystring').parse(parsedUrl.query);
    var url = cleanUrl(parsedUrl.pathname);
	
	if(url.lastIndexOf('/') === url.length - 1) { url = url.slice(0, url.length ); }
	if(url[0] === '/') { url = url.slice(1, url.length);  }

	if(vpath && url.indexOf(vpath) != 0) {
		console.log('url does not begin with vpath');
		throw 'url [' + url + '] does not begin with vpath [' + vpath + ']';
	}

	if(req.method != 'HEAD') {
		console.log(req.method + ' ' + req.url);
	}
	var relativePath = vpath && url.indexOf(vpath) == 0 ?
		path + url.slice(vpath.length + 1, url.length):
		path + url;	
	
	try {
		if(readOnly && req.method != 'GET') {
			writeError(req.method + ' forbidden on this resource', 403);
		} else {
			switch(req.method) {
				case 'HEAD':
					if(logHeadRequests) {
						console.log('head: ' + relativePath);				
					}
					fs.stat(relativePath, function(err, stats) {
						if(err) { writeError(err); } 
						else {					
							res.setHeader('Last-Modified', stats.mtime);		
							res.setHeader("Expires", "Sat, 01 Jan 2000 00:00:00 GMT");
							res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
							res.setHeader("Cache-Control", "post-check=0, pre-check=0");
							res.setHeader("Pragma", "no-cache");
							
							if(stats.isDirectory()) {								
								res.setHeader('Content-Type', query.type == 'json' || query.dir == 'json' ? 'application/json' : 'text/html');
							} else {
								if(query.type == 'json' || query.dir == 'json') {
									res.setHeader('Content-Type', 'application/json');
								}
								else {
									var type = require('mime').getType(relativePath);
									res.setHeader('Content-Type', type);
									res.setHeader('Content-Length', stats.size);
								}
							}
							res.end();							
						}
					});
					break;
				case 'GET':
					console.log('relativePath: ' + relativePath);
					if(url === 'favicon.ico') { 	
						res.end();
					} else {
						fs.stat(relativePath, function(err, stats) {
							if(err) { writeError(err); } 
							else {
								if(stats.isDirectory()) {
									res.setHeader('Last-Modified', stats.mtime);							
									res.setHeader("Expires", "Sat, 01 Jan 2000 00:00:00 GMT");
									res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
									res.setHeader("Cache-Control", "post-check=0, pre-check=0");
									res.setHeader("Pragma", "no-cache");
									console.log('reading directory ' + relativePath);
									fs.readdir(relativePath, function(err, files) {
										if(err) { 
											console.log('writeError');
											writeError(err); 
										}
										else {
											var results = [];
											var search = {};
											search.stats = function(files) {
												if(files.length) { 
													var file = files.shift();
													fs.stat(relativePath + '/' + file, function(err, stats) { 
														if(err) { writeError(err); } 
														else {
															stats.name = file;
															stats.isFile = stats.isFile();
															stats.isDirectory = stats.isDirectory();
															stats.isBlockDevice = stats.isBlockDevice();
															stats.isFIFO = stats.isFIFO();
															stats.isSocket = stats.isSocket();
															results.push(stats);
															search.stats(files);															
														}
													});
												} else {
													if(query.type == 'json' || query.dir == 'json') {
														res.setHeader('Content-Type', 'application/json');
														res.write(JSON.stringify(results)); 
														res.end();
													} else { 
														res.setHeader('Content-Type', 'text/html');											
														res.write('<html><body>');
														for(var f = 0; f < results.length; f++) {
															var name = results[f].name;
															var normalized = url + '/' + name;
															while(normalized[0] == '/') { normalized = normalized.slice(1, normalized.length); }
															if(normalized.indexOf('"') >= 0) throw new Error('unsupported file name')
															name = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
															res.write('\r\n<p><a href="/' + normalized + '"><span>' + name + '</span></a></p>');
														}
														res.end('\r\n</body></html>');
													}
												}
											};
											search.stats(files);
										}
									});
								} else {
									console.log('reading file ' + relativePath);
									if(query.type == 'json' || query.dir == 'json') {
										var type = 'application/json';
										res.setHeader('Content-Type', type);
										fs.readFile(relativePath, function(err, data) { 
											if(err) { writeError(err); }
											else {
												res.end(JSON.stringify({ 
													data: data.toString(),
													type: require('mime').getType(relativePath),
												})); 
											}
										});
									} else {
										var type = require('mime').getType(relativePath);
										res.setHeader('Content-Type', type);
										fs.readFile(relativePath, function(err, data) { 
											if(err) { writeError(err); }
											else {
												res.setHeader('Content-Length', data.length);
												res.end(data); 
											}
										});
									}
								}
							}
						});
					}
					return;
				case 'PUT':
					console.log('writing ' + relativePath);
					var stream = fs.createWriteStream(relativePath);		
					stream.ok = true;
					req.pipe(stream);
					stream.on('close', function() { 
						if(stream.ok) {
							res.end();
						}
					});
					stream.on('error', function(err) { 										
						stream.ok = false;
						writeError(err);
					});
					return;
				case 'POST':
					if(query.rename) {
						console.log('rename: ' + relativePath);
						query.rename = cleanUrl(query.rename);
						if(vpath) { 
							if(query.rename.indexOf('/' + vpath + '/') == 0) { 
								query.rename = query.rename.slice(vpath.length + 2, query.rename.length);
							} else {
								throw 'renamed url [' + query.rename + '] does not begin with vpath [' + vpath + ']';
							}
						} 
						console.log('renaming ' + relativePath + ' to ' + path + query.rename);
						fs.rename(relativePath, path + query.rename, function(err) {
							if(err) { writeError(err); } 
							else {
								res.end();
							}
						});
					} else if(query.create == 'directory') {
						console.log('creating directory ' + relativePath);
						fs.mkdir(relativePath, 0777, function(err) { 
							if(err) { writeError(err); } 
							else {
								res.end();
							}
						});
					} else {
						console.log('relativePath: ' + relativePath);
						writeError('valid queries are ' + url + '?rename=[new name] or ' + url + '?create=directory');
					}
					return;
				case 'DELETE':			
					fs.stat(relativePath, function(err, stats) { 
						if(err) { writeError(err); } 
						else {
							if(stats.isDirectory()) {
								console.log('deleting directory ' + relativePath);
								fs.rmdir(relativePath, function(err) {
									if(err) { writeError(err); }
									else { 
										res.end(); 
									}
								});
							} else {
								console.log('deleting file ' + relativePath);
								fs.unlink(relativePath, function(err) {
									if(err) { writeError(err); }
									else { 
										res.end(); 
									}
								});
							}
						}
					});			
					return;
				default:
					console.log('unsupported: ' + relativePath);				
					writeError('Method ' + method + ' not allowed', 405);
					return;
			}
		}
	} catch(err) { 
		writeError('unhandled error: ' + err);
	}
};
