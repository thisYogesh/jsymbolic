$S(document, ':)', function(){
	$S('>X<',{
		url : app.baseurl + '/getSymbols',
		type : 'GET',
		success : function(resp){
			resp = JSON.parse(resp);
			var t = temp.listSymbols(resp);
			$S('.apis','>+{temp}', {temp : t});
		}
	});
});