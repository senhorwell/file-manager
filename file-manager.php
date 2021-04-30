<?php
$path = "arquivos";
?>
<html>
	<head>
		<title>Trabalho de SO</title>
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js" ></script>
	</head>
	<body>
		<h1>Lista de Arquivos do diretório <strong> '<?php echo $path ?>' </strong>:<br /></h1>
        <ul>
        <?php
            $diretorio = dir($path);

            while($arquivo = $diretorio -> read()){
            echo "<a href='http://127.0.0.1:8000/gerenciador.php/".$path."/".$arquivo."'>".$arquivo."</a><br />";
            }
            $diretorio -> close();
        ?>
        </ul>
		<fieldset>
			<p><strong>Ler arquivo ou pasta</strong></p>
			<div>
				<label for="get" >Nome:</label>
				<input type="text" id="get" /> 
			</div>
			<input type="button" id="get-btn" value="Ler" />
		</fieldset>
		<script>
			$('#get-btn').click(function() {
				if($('#get').val()) {
					window.open($('#get').val());
				}
			});
		</script>	
		
		<fieldset>
			<p><strong>Escrever arquivo</strong></p>
			<label for="write-path" >Path:</label>
			<input type="text" id="write-path" /> 
			<br>
			<label for="write-contents" >Conteudo:</label>
			<input type="text" id="write-contents" /> 
			<input type="button" id="write-btn" value="Escrever" />
			<div id="write-msg"></div>
		</fieldset>	
		<script>
			$('#write-btn').click(function() {
				if($('#write-path').val()) {
					$.ajax({
						type: 'PUT',
						url: '/' + $('#write-path').val(),
						data: $('#write-contents').val(),
					}).done(function(data) { 
						$('#write-msg').html('<a href="' + $('#write-path').val() + '">Concluido</a>');		
					}).fail(function(err) { 
						$('#write-msg').html('Falha ' + JSON.stringify(err));
					});											
				}
			});
		</script>	
		
		<fieldset>
			<p><strong>Criar pasta</strong></p>
			<label for="create" >Nome da pasta:</label>
			<input type="text" id="create" /> 
			<br>
			<input type="button" id="create-btn" value="Criar" />
			<div id="create-msg"></div>
		</fieldset>
		<script>
			$('#create-btn').click(function() {
				if($('#create').val()) {				
					$.ajax({
						type: 'POST',
						url: '/' + $('#create').val(),
					}).done(function(data) { 
						$('#create-msg').html('<a href="' + $('#create').val() + '">Concluido</a>');		
					}).fail(function(err) { 
						$('#create-msg').html('Falha ' + JSON.stringify(err));
					});
				}
			});
		</script>
		
		<fieldset>
			<p><strong>Renomear arquivo ou pasta</strong></p>
			<label for="rename-old" >Nome antigo:</label>
			<input type="text" id="rename-old" /> 
			<br>
			<label for="rename-new" >Nome novo:</label>
			<input type="text" id="rename-new" /> 
			<input type="button" id="rename-btn" value="Renomear" />
			<div id="rename-msg"></div>
		</fieldset>
		<script>
			$('#rename-btn').click(function() {
				if($('#rename-old').val() && $('#rename-new').val()) {				
					$.ajax({
						type: 'POST',
						url: '/' + $('#rename-old').val() + $('#rename-new').val()
					}).done(function(data) { 
						$('#rename-msg').html('<a href="' + $('#rename-new').val() + '">Concluido</a>');		
					}).fail(function(err) { 
						$('#rename-msg').html('Falha ' + JSON.stringify(err));
					});
				}
			});
		</script>
		
		<fieldset>
			<p><strong>Deletar arquivo ou pasta</strong></p>
			<label for="delete" >Nome do arquivo/pasta:</label>
			<input type="text" id="delete" /> 
			<br>
			<input type="button" id="delete-btn" value="Deletar" />
			<div id="delete-msg" ></div>
		</fieldset>			
		<script>
			$('#delete-btn').click(function() {
				if($('#delete').val()) {				
					var url = $('#rename-old').val() + $('#rename-new').val();
					console.log(url);
					$.ajax({
						type: 'DELETE',
						url: '/' + $('#delete').val()
					}).done(function(data) { 
						$('#delete-msg').html('Concluido');		
					}).fail(function(err) { 
						$('#delete-msg').html('Falha ' + JSON.stringify(err));
					});
				}
			});
		</script>
	</body>
	
</html>