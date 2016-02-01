var temp = {
	listSymbols : function(data){
		var html = 	"<%_.each(data,function(a,b,c){%>" +
						"<div class='apiItem'>" +
							"<div class='sycol sym'><%=a.symbol%></div>" +
							"<div class='sycol sym_info'>" +
								"<span class='sname'><%=a.symbol_functional_name%></span>" +
								"<div class='sdesc'><%=a.desc%></div>" +
							"</div>" +
							"<span class='show_ex'></span>" +
						"</div>" +
					"<%})%>";
		return this.create(html, data);
	},
	create : function(html, data){
		var html = _.template(html)({ data:data });
		return html;
	}
}