/*
 * jSymbolic javaScript Library v1.0 Beta
 * Copyright 2016, Yogesh Jagdale
 * http://www.jsymbolic.com
 * 
 * Includes Sizzle.js (c) jQuery Foundation, Inc.
 * http://sizzlejs.com/
 */
(function (doc, win) {
    var type = {
        string : 'string',
        number : 'number',
        function : 'function',
        object : 'object',
        undefined : 'undefined',
        boolean : 'boolean'
    };
    var am = {
        push : Array.prototype.push,
        splice : Array.prototype.splice
    };
    var jsEvent = []; // this variable used for jSymbolic event handeling tracking
    var bool = {true: true, false: false};
    var udf = 0; // this variable used for jSymbolic user defined function
    var jSymbolic = function (sel, symbols, op) {
        var j = new jSymbolic.fun._(sel, symbols, op);
        return typeof j.return == type.undefined ? j : j.return;
    };
    jSymbolic.fun = jSymbolic.prototype = {
        _: function (sel, symbols, op) { 
            /* 
                op : it is used for callback function 
                symbols : it is used for the assign symbols
            */
			var args = arguments;//
            sel ? this.sel = sel : sel;
            symbols ? this.symbols = symbols : symbols;
            op ? this.op = op : op;
            var chsym = this.filterSymbols(sel); // check for utility symbol
            if( chsym.length == 0 || this.mainCtx){ // chsym.length == 0 i.e. selector is not associated with any symbols
                if (!this.mainCtx) { // fallback for next _js initialization
                    this.mainCtx = (function(sel){
                        var val;
                        if(sel.nodeType != 9 && sel.nodeType != 1 && typeof sel == type.string ){
                            val = jSymbolic.selectorBuilder(doc, sel);
                        }else{
                            val = sel;
                        }
                        return val;
                    })(sel);
                    this.subCtx = [];
                } else {
                    this.oldObject = true;
                    this.return = null; // asign null to return, since when $S._ function initiate next time.
                    this.symbols = args[0];
                    this.op = args[1];
                }

                this.IFC = false; // Internal function calling
                this.symbols ? this.sym_to_fn() : this.symbols;
                //this.splice = [].splice;
            }else if( chsym.length == 1 && chsym[0].symType == "util" ){ //chsym.length == 1 i.e. selector is associated with any one of symbols
                if(chsym[0].fun == "ajax"){ // for ajax
                    this.op = this.symbols;
                    this.symbols = this.sel;
                    this.ajax(this.symbols, this.op);
                }else if(chsym[0].fun == "plugin"){ // for plugin
                    this.plugin(this.symbols, this.op);
                }
            }
            return this.oldObject ? this.return ? this.return : this : this;
        },
        sym_to_fn: function () {
            var fn = this.filterSymbols(this.symbols, this.op);
            this.for(fn, function(a,b,c){
                this.fn = a; // getting function set
                var ele = this.getEle();
                if(this.fn.symType == "udf"){ // for plugin
                    this[this.fn.fun](ele, this.op);
                }else if(!this.fn.param){ // standalone symbol
                    if(!ele.length){
                        this[this.fn.fun](ele, this.fn.param, this.op);
                    }else{
                        var el = [];
                        if(this.fn.symType != "rctx"){
                            this.fn.symType == "context" ? this.IFC = true : this.IFC;
                            for( var x = 0; x < ele.length; x++ ){
                                this.IFC ? el.push(this[this.fn.fun](ele[x])) : this[this.fn.fun](ele[x]);
                            }
                            this.IFC = false;
                            if(el.length > 0) this.subCtx.push(el.clean());
                        }else if(this.fn.symType == "rctx"){
                            this[this.fn.fun]();
                        }
                    }
                }else if(this.fn.param){ // parameterised symbol
                    if(this.fn.symType != "function"){
                        if(!ele.length){
                            this[this.fn.fun](ele, this.fn.param, this.op);
                        }else{
                            var el = [];
                            this.fn.symType == "context" ? this.IFC = true : this.IFC;
                            if(this.fn.symType == "index"){
                                this[this.fn.fun](ele, this.fn.param, this.op);
                            }else{
                                for( var x = 0; x < ele.length; x++ ){
                                    this.IFC ? el.push(this[this.fn.fun](ele[x], this.fn.param, this.op)) :this[this.fn.fun](ele[x],this.fn.param, this.op);
                                }
                            }
                            this.IFC = false;
                            if(el.length > 0) this.subCtx.push(el.clean());
                        }
                    }else if(this.fn.symType == "function"){
                        this[this.fn.fun](ele, this.fn.param, this.op);
                    }
                }
            });
        },
        getEle : function(){
            return this.subCtx.length == 0 ? this.mainCtx : this.subCtx.last();
        },
        filterSymbols : function(symbolStr, op){
            op = op || {};
            var sData = this.symToLogicMaping;
            var symbols = new JSONs(sData).getValOf("symbol");
            var symbolicData = [];
            var charData = {
                dot : 0,
                LCB : "{",
                RCB : "}"
            };
            for(var i1=0; i1<symbolStr.length; i1++){
                var i=i1, sym = "";
                while((!/[\.\{]/.test(symbolStr[i]) && typeof symbolStr[i] != type.undefined) || i == i1 ){
                    sym += symbolStr[i];
                    i++;
                }
                for(var i2=0; i2<symbols.length; i2++){
                    if(sym == symbols[i2]){
                        var fndata = new JSONs.prototype.clone(sData[i2]);
                        symbolicData.push(fndata);
                        if( /\{/.test(symbolStr[i])){
                            var len = symbolStr.indexOf(charData.RCB, i) - i;
                            var param = symbolStr.substr(i + 1, len - 1);
                            if(op.hasOwnProperty(param))param = op[param];
                            symbolicData[symbolicData.length - 1].param = param;
                            i+=(len+1);
                        }
                        break;
                    }
                }
                i1+=(i-i1);
            }
            return symbolicData;
        },
        obExt: function (def, udef) {
            if (typeof udef != type.undefined) {
                var dkey = new JSONs().getKeys(def);
                for (var p=0;p<dkey.length;p++) {
                    if ( typeof udef[dkey[p]] != type.undefined ){
                        def[dkey[p]] = udef[dkey[p]];
                    }
                }
                return def;
            }
            else return def;
        }
    };
    jSymbolic.ext = function (extFun) {
        if(arguments.length == 1){
            for (var fun in extFun) {
                this.prototype[fun] = extFun[fun];
            }
        }
    }
    /* symbol function which used by symbol character end  */

    jSymbolic.ext({
        nxt: function (e) {
            while(e.nextSibling && e.nextSibling.nodeType == 3){
                e = e.nextSibling;
            }
            e = e.nextSibling;
            if (!this.IFC) e ? this.subCtx.push(e) : e; else return e;
        },
        prev: function (e) {
            while(e.previousSibling && e.previousSibling.nodeType == 3){
                e = e.previousSibling;
            }
            e = e.previousSibling;
            if (!this.IFC) e ? this.subCtx.push(e) : e; else return e;
        },
        parent: function (e) {
            e = e.parentNode;
            if (!this.IFC) e ? this.subCtx.push(e) : e; else return e;
        },
        childs: function (e) {
            e = e.children;
            if (!this.IFC) e ? this.subCtx.push(e) : e; else return e;
        },
        find: function (e, sel) {
            e = jSymbolic.selectorBuilder(e, sel);
            if (!this.IFC) e.length > 0 || e.nodeType ? this.subCtx.push(e) : e; else return e;
        },
		indx: function(el, indx){
			indx = Number(indx);
			this.subCtx.push(el[indx]);
		},
        fst_by_indx: function (coll, indx) {
            if (!this.IFC) this.subCtx.push(coll[indx - 1]); else return coll[indx - 1];
        },
        lst_by_indx: function (coll, indx) {
            if (!this.IFC) this.subCtx.push(coll[coll.length - indx]); else return coll[coll.length - indx];
        },
        append: function (e, tempVar) {         // building append function
            var cont = tempVar;
            var newEle = this.strToHtml(cont);
            this.apnd(e, newEle);
        },
        prepend: function (e, tempVar) {
            var cont = tempVar;
            var newEle = this.strToHtml(cont);
            e.childNodes[0] ? this.prnd(e.childNodes[0], newEle) : this.apnd(e, newEle);
        },
        before: function (e, tempVar) {
            var cont = tempVar;
            var newEle = this.strToHtml(cont);
            this.prnd(e, newEle);
        },
        after: function (e, tempVar) {
            var cont = tempVar;
            var newEle = this.strToHtml(cont);
            if (e.nextSibling.nodeType) this.prnd(e.nextSibling, newEle);
            else this.apnd(e.parentNode, newEle);
        },
        text: function(e, args, op){
            this.el(e, "textContent", op);
        },
        sbls: function (e) {
            var el = this.IFC_(e.parentNode, 'childs');
            if (el) {
                var ele = [];
                this.for(el, function(a,b,c){
                    if (a != e) ele.push(a);
                });
            }
            if (!this.IFC) this.subCtx.push(ele); else return ele;
        },
        reduceCtx: function (e, len) {
            if (len != 'x') {// provide 'x' symbol to the function to clean contaxt
                len = Number(len) || 1;
                len = len > this.subCtx.length ? 0 : len;
            } else len = this.subCtx.length;
            if (this.subCtx) this.subCtx.splice(this.subCtx.length - len);
        },
        attr: function (e, attr, obj) {
            attr = this.formateArg(attr, obj);
            if (this.fn.symFor != 'x') {
                this.setAttr(e, attr);
                if(attr.val)this.getAttr(e, attr.val); 
            } else {
                this.removeAttr(e, attr);
            }
        },
        css: function (e, attr, obj) {
            attr = this.formateArg(attr, obj);
            this.setCSS(e, attr);
            if(attr.val)this.getCSS(e, attr.val);
        },
        formateArg: function(args, obj){// used for to make arguments in to json object
            if(typeof args != type.undefined){
                if ((args.indexOf('=') == -1 && args.indexOf(':') == -1) && typeof obj != type.undefined ){
                    args = obj[args];
                }
                args = typeof args == type.string ? this.mkAttrStr_to_JSON(args) : args;
            }
            return args;
        },
        _class: function (e, cprop) {
            cprop = cprop.split(' ').removeDuplicate();
            var svc = e.className.split(' ');
            if (this.fn.symFor == '+') { // add class
                this.for(svc, function(a,b,c){
                    if (cprop.indexOf(a) > -1) {
                        cprop.splice(cprop.indexOf(a), 1);
                    }
                });
                e.className += svc[0] == '' ? cprop[0] : cprop.join(' ').length > 0 ? ' ' + cprop.join(' ') : '';
            }
            else if (this.fn.symFor == 'x') { // remove class
                this.for(cprop, function(a,b,c){
                    if (svc.indexOf(a) > -1) {
                        svc.splice(svc.indexOf(a), 1);
                    }
                });
                e.className = svc.join(' ');
            }
        },
        remove: function (e) {
            e.remove();
        },
        clone: function (e) {
            var elStr = e.outerHTML;
            var el = this.strToHtml(elStr)[0];
            if (!this.IFC) this.subCtx.push(el); else return el;
        },
        ehtml: function(e, attr, obj){
            this.el(e, "innerHTML", obj);
        },
        IFC_: function (e, fun, sel, op) {
            this.IFC = true;
            var el = this[fun](e, sel, op);
            this.IFC = false;
            return el;
        },
        val: function (e, prop, op) {
            this.el(e, "value", op);
        },
        el : function(e, prop, op){ // el function is used to retrive other than attributes and style properties
            prop = this.formateArg(prop, op);
            if(prop.val){
                this.forEach(prop.val, function(a,b,c,d){
                    c[b] = e[b];  //e[b] : putting value in.
                });
                this.setReturn(e, prop.val);
            }
        },
        $ : function(e, fun){
            fun.call(e);
        },
        $each: function(e, fun){
            this.for(e, function(a,b,c,d){
                fun.call(a, a, b, c);
            });
        }
    });
    /* symbol function which used by symbol character */
    /*jSymbolic event binding functions*/
    jSymbolic.ext({
        symEvent : function(e, args, op){
            /*  e           :: element
                evName      :: event name, 
                fun         :: event function,
                o_f         :: on/ off,
                bubbling    :: true/ false event bubbling, capturing
            */
            var ev = this.formateEventArg(args, op); // formatting args in to evObj
            ev.eventName = ev.eventName.split(" ");
            if(this.fn.symbol == "+="){ // bind event
                if(ev.o_f == "off"){
                    this.for(ev.eventName, function(evName, b, c, d){
                        e.addEventListener(evName, ev.callback, ev.bubbling); 
                        this.trackEvent(e, evName, ev.callback);
                    });
                }
            }else if(this.fn.symbol == "-="){ // unbind event
                if(ev.o_f == "off"){
                    this.for(ev.eventName, function(evName, b, c, d){
                        var events = this.getEvent(e, evName);
                        this.for(events, function(i, j, k){
                            e.removeEventListener(evName, i, ev.bubbling);
                        });
                    });
                }
            }
        },
        getEvent : function(e, eventName){ // getting event on element
            var ev;
            this.for(jsEvent, function(a,b,c,d){
                if(a.el == e && a.events[eventName].length > 0){
                    ev = a.events[eventName];
                    d.break = true;
                }
            });
            return ev;
        },
        trackEvent : function(e, evName, evCallback){ // saves all events against element in jsEvent variable
            var elExists = false;
            this.for(jsEvent, function(a,b,c,d){
                if(a.el == e){ // if true meanse some events are applied on this elements
                    if(a.events.hasOwnProperty(evName)){ // checking event is exists on the element
                        a.events[evName].push(evCallback) // if present then add this one
                    }else{ // else add new event into jsEvent against element
                        a.events[evName] = []; // add event to element variable
                        a.events[evName].push(evCallback);
                    }
                    elExists = true;
                    d.break = true;
                }
            });

            if(!elExists){ // else add new entry into jsEvent variable
                var evt = {el : e, events: {}};
                evt.events[evName] = [];
                evt.events[evName].push(evCallback);
                jsEvent.push(evt);
            }
        },
        formateEventArg : function(args, op){ // formatting args in to evObj
            var evObj = {};
            if(args.length > 0){
                args = args.split(",");
                evObj.eventName = args[0];
                evObj.callback = (function(){
                    if(args[1] != undefined && op[args[1]] != undefined){
                        return op[args[1]];
                    }else if(args[1] == undefined && typeof op == type.function){
                        return op;
                    }
                    //args[1] != undefined ? op[args[1]] != undefined ? op[args[1]] : args[1] : args[1];
                })();
                evObj.o_f = args[2];
                evObj.bubbling = args[3];

                evObj = this.obExt({
                    eventName : "",
                    callback : "",
                    o_f : "off",
                    bubbling : bool.false
                }, evObj);
            }
            return evObj;
        }
    });

    /* dataset manipulation */

    jSymbolic.ext({
        dataset : function(e, args, op){ // asign dataset properties
            args = this.formateArg(args, op);
            this.forEach(args, function(a, b, c, d){
                if(b != "val"){
                    e.dataset[b] = a;
                }
            });
            if(args.val){
                this.dataget(e, args.val)
                this.setReturn(e, args.val);
            }
        },
        dataget : function(e, args){ // get dataset properties
            this.forEach(args, function(a,b,c,d){
                c[b] = e.dataset[b];
            });
        }
    });

    /* dataset manipulation */
    
    /* jSymbolic enter to plugin */

    jSymbolic.ext({
        plugin : function(symbol, fun){
            var symHandler = {
                fun : "udf" + udf++, // 
                symbol : symbol,
                symType : "udf"
            }
            jSymbolic.prototype[symHandler.fun] = function(e, op){
                this.pluginInit(e, op, fun);
            }
            this.symToLogicMaping.push(symHandler); // adding symHandler object in symbol list
        },
        pluginInit : function(e, op, fun){
            var pluginReturn = fun.call(e, op);
            if(!(pluginReturn instanceof jSymbolic)){
                var rObj = {};
                rObj[this.fn.symbol] = pluginReturn;
                this.setReturn(e, rObj);
            }
        }
    });

    /* jSymbolic enter to plugin */

    /* Heart of jSymbolic */

    jSymbolic.fun.symToLogicMaping = [
        { fun: 'el', symbol: 'e', symType: 'opt'},                                          // return properties of element 
        { fun: '$', symbol: '$', symType: 'function'},                                      // executable function
        { fun: '$each', symbol: '$*', symType: 'function'},                                 // executable function
        { fun: 'ehtml', symbol: '</>', symPara: 'MULTI', symType: 'opt'},                   // get innerHtml or outerHtml
        { fun: 'nxt', symbol: '>', symPara: 'MONO', symType: 'context' },                   // next
        { fun: 'prev', symbol: '<', symPara: 'MONO', symType: 'context' },                  // previous
        { fun: 'parent', symbol: '^', symPara: 'MONO', symType: 'context' },                // parent
        { fun: 'after', symbol: '>|', symPara: 'MULTI', symType: 'opt' },                   // after
        { fun: 'before', symbol: '|<', symPara: 'MULTI', symType: 'opt' },                  // before
        { fun: 'find', symbol: '?', symPara: 'MULTI', symType: 'context' },                 // find
        { fun: 'indx', symbol: '!', symPara: 'MULTI', symType: 'index' },                   // find within collection by index
        { fun: 'sbls', symbol: '~', symPara: 'MONO', symType: 'context' },                  // siblings
        { fun: 'childs', symbol: '<>', symPara: 'exe', symType: 'context' },                // childrens
        { fun: 'append', symbol: '>+', symPara: 'MULTI', symType: 'opt' },                  // append
        { fun: 'prepend', symbol: '+<', symPara: 'MULTI', symType: 'opt' },                 // prepend
        { fun: 'height', symbol: '|', symPara: 'MONO' },                                    // height
        { fun: 'width', symbol: '_', symPara: 'MONO', },                                    // width
        { fun: 'remove', symbol: 'x', symPara: 'exe', symType: 'opt' },                     // remove
        { fun: 'clone', symbol: '||', symPara: 'context', symType: 'opt' },                 // clone
        { fun: 'reduceCtx', symbol: '.', symPara: 'exe', symType: 'rctx' },                 // poping the context from mainCtx
        { fun: 'attr', symbol: '@', symPara: 'MULTI', symFor: '+', symType: 'opt' },        // add attribute
        { fun: 'attr', symbol: '@x', symPara: 'MULTI', symFor: 'x', symType: 'opt' },       // remove attribute
        { fun: 'css', symbol: '&', symPara: 'MULTI', symType: 'opt' },                      // CSS
        { fun: '_class', symbol: '&+', symPara: 'MULTI', symType: 'opt', symFor: '+' },     // add CSS class
        { fun: '_class', symbol: '&x', symPara: 'MULTI', symType: 'opt', symFor: 'x' },     // remove CSS class
        { fun: 'symEvent', symbol: '+=', symPara: 'MULTI', symType: 'opt' },                // bind event
        { fun: 'symEvent', symbol: '-=', symPara: 'MULTI', symType: 'opt' },                // unbind event
        { fun: 'val', symbol: '%', symPara: 'MULTI', symType: 'opt'},                       // return value of input elements
        { fun: 'fst_by_indx', symbol: '>Rx{\d+}', symPara: 'MONO-MULTI', symType: 'opt' },  // finding elements from 1 to end using index
        { fun: 'lst_by_indx', symbol: '<Rx{\d+}', symPara: 'MONO-MULTI', symType: 'opt' },  // finding elements from last to first elements using index
        { fun: 'dataset', symbol: '#', symPara: 'MULTI', symType: 'opt' },                  // manipulating html5's dataset
        { fun: 'text', symbol: ',', symType: 'opt' },                                       // retrive text from element
        { fun: 'load', symbol: ':)', symPara: 'MULTI', symType: 'opt' },                    // jSymbolic exclusive symbol for DOM load event
        { fun : 'plugin', symbol: '(%)', symPara: 'MULTI', symType: 'util'},                // add plugin
        { fun: 'ajax', symbol: '>X<', symPara: 'MULTI', symType: 'util'}                    // ajax (Asyncronus javascript and XML)
    ];
    
    /* Heart of jSymbolic */

    /* jSymbolic exclusive load symbol  */
    jSymbolic.ext({
        load: function (e, fun, op) {
            if (document.body || document.readyState == 'complete') {
                if(fun != undefined  && typeof fun == type.function) {
                    fun();
                }else if(op != undefined  && typeof op == type.function){
                    op();
                }
            } else {
                setTimeout(function () { this.load(e, fun, op) }.bind(this), 1);
            }
        }
    });

    jSymbolic.ext({
        len: function (l) {
            l = typeof l == "undefined" ? 0 : l;
            this.length = l;
        },
        htmlStr: function (e, iohtml) {
            if (!e)e = this.getEle(); // if e is not passed, take it from context.
            if(iohtml == "i") // if i then retrive innerHTML
                return e.innerHTML;
            else if(iohtml == "o") // if o then retrive outerHTML
                return e.outerHTML;
        },
        strToHtml: function (str) {
            var dumy = document.createElement('div');
            dumy.innerHTML = str;
            return dumy.childNodes;
        },
        apnd: function (e, newEle) {
            e.appendChild(newEle[0]);
            newEle[0] ? newEle[0].nodeType ? this.apnd(e, newEle) : true : true;
        },
        prnd: function (e, newEle) {
            e.parentNode.insertBefore(newEle[0], e);
            newEle[0] ? newEle[0].nodeType ? this.prnd(e, newEle) : true : true;
        },
        setAttr: function (e, attr) {
            this.forEach(attr, function(a,b,c){
                if(b != "val")e.setAttribute(b, a);
            });
        },
        getAttr: function(e, attr){
            this.forEach(attr, function(a,b,c){
                this.for(e.attributes, function(i,j,k){
                    if(i.nodeName == b){
                        c[b] = i.nodeValue;
                    }
                });
            });
            this.setReturn(e, attr);
        },
        removeAttr: function (e, attr) {
            this.forEach(attr.val, function(a,b){
                e.removeAttribute(b);
            });
        },
        setCSS: function (e, css) {
            for (var style in css) {
                if(style != "val")
                    e.style[style] = css[style];
            }
        },
        getCSS: function(e, css){
            for(var prop in css){
                css[prop] = e.style[prop];
            }
            this.setReturn(e, css);
        },
        mkAttrStr_to_JSON: function (attr) {// making attribute : value pairs
            var attr = attr.split(/,|;/);
            var aryJSONstr = {};
            for (var at = 0; at < attr.length; at++) {
                //var attrs = attr[at].split(/=|:/);
                var attrs = function(a){
                    var eqlind = a.indexOf("="), colind = a.indexOf(":");
                    if((eqlind < colind && eqlind != -1) || (eqlind > -1 && colind == -1)){ // for = seperator
                        return [a.substr(0,eqlind),a.substr(eqlind + 1)];
                    }else if((colind < eqlind && colind != -1) || (colind > -1 && eqlind == -1)){
                        return [a.substr(0,colind),a.substr(colind + 1)];
                    }else{
                        return [a];
                    }
                }(attr[at]);
                if(attrs.length == 1){
                    if(!aryJSONstr.val) aryJSONstr.val = {};
                    aryJSONstr.val[attrs[0]] = "";
                    continue;
                }
                var attrName = attrs[0],attrVal = attrs[1];
                aryJSONstr[attrName] = attrVal;
            }
            return aryJSONstr;
        },
        _alice: function () {
            if (this.fn.alice) {
                this.alice = this.alice || {};
                if (!this.alice[this.fn.alice]) this.alice[this.fn.alice] = this.subCtx[this.subCtx.length - 1];
            }
        },
        forEach : function(collection, fun){
            var loop = {break :false};
            for(var i in collection){
                fun.call(this, collection[i], i, collection, loop) // param : property value, property name, main variable
                if(loop.break)break;
            }
        },
        for : function(collection, fun){ // it's work like normal for loop
            var loop = {break :false};
            if(collection.length){
                for(var i=0; i<collection.length; i++){
                    fun.call(this, collection[i], i, collection, loop);
                    if(loop.break)break;
                }
            }else{
                fun.call(this, collection, 0, collection);
            }
        },
        setReturn: function(e, values){
            if(arguments.length != 2)throw "setReturn require 2 arguments";
            var i = 0, val = [], vl = {};
            !this.returnVal ? this.returnVal = [] : this.returnVal;
            if(this.returnVal.length == 0){
                vl.el = e;
                vl.return = values;
                this.returnVal.push(vl);
            }else{
                var r = new JSONs(this.returnVal).getValOf('el');
                this.for(e, function(e){
                    var br = false;
                    if(r.indexOf(e) > -1){ // check if element is already took for return;
                        this.for(this.returnVal, function(a,b,c,loop){
                            this.forEach(a, function(x,y,z,loop1){
                                if(y == 'el' && a.el == e){
                                    a.return = new JSONs(a.return).join(values); // copy one json into another json
                                    br = true;
                                }
                                if(br)loop1.break = true;
                            });
                            if(br)loop.break = true;
                        });
                    }else{ // else init freshly 
                        vl.el = e;
                        vl.return = values;
                        this.returnVal.push(vl);
                    }
                });
            }
            if(this.returnVal.length == 1){
                this.forEach(this.returnVal[0].return, function(a, b, c){
                    if(i > 1)Break=true;else i++;
                    val.push(a);
                });
                if(i==1) this.return = val[0];
                else if(i > 1) this.return = this.returnVal[0].return;
            }else{
                this.return = this.returnVal;
            }
        }
    });

    /* Enter to Ajax */

    jSymbolic.ext({
        ajax : function(sel, op){
            var op = this.obExt({
                type : "GET",
                url : "",
                data : {},
                dataType : "",
                timeout : null,
                success : null,
                error : null
            }, op);

            var ajaxObj = (function(w){
                var xObj = {
                    type : 0,       // 1 is for XMLHttpRequest, 2 is for XDomainRequest
                    ajax_ : null
                };
                if(w.XMLHttpRequest){
                    xObj.type = 1;
                    xObj.ajax_ = new XMLHttpRequest();
                }else if(w.XDomainRequest){
                    xObj.type = 2;
                    xObj.ajax_ = new XDomainRequest();
                }
                return xObj;
            })(window);

            if(ajaxObj.type != 0 && ajaxObj.type == 1){ // for XMLHttpRequest
                ajaxObj.ajax_.open(op.type, op.url);
                ajaxObj.ajax_.onreadystatechange = function(resp){
                    if(resp.currentTarget.readyState == 4){
                        var response = resp.currentTarget.responseText;
                        if(typeof response == type.string){}
                        if(op.success) op.success(resp.currentTarget.responseText);
                    }
                }
                ajaxObj.ajax_.onerror = function(resp){
                    if(op.error) op.error(resp);
                }
                ajaxObj.ajax_.send(op.data ? op.data : null);
            }
            this.return = ajaxObj.ajax_; // setting original ajax object to return property
        }
    });

    /* Enter to Ajax */

    jSymbolic.selectorBuilder = function (ctx, s) {
        var el = Sizzle(s, ctx);
        return el.length == 1 ? el[0] : el;/**/
    }

    jSymbolic.addJSONP = function (jO, prop, val) {
        var newProp = '\"' + prop + '\":' + val;
        jO = JSON.stringify(jO);
        jO = jO.match(/(\"\w+\"\:\w+\,)+\"\w+\"\:\w+/);
        jO = jO ? jO[0].split(',') : [];
        jO.push(newProp);
        jO = '{' + jO.join(',') + '}';
        return JSON.parse(jO);
    }

    jSymbolic.prototype._.prototype = jSymbolic.prototype;

    return $S = win.jSymbolic = jSymbolic;  // return main jSymbolic object
})(document, window);

var JSONs = function (obj) {
    if (typeof this != 'object') return;
    this[0] = obj;
    return this;
}
JSONs.prototype.get = function (obj) {
    var O=[], keys = this.getKeys(obj);
    for (var i in this[0]) {
        if (this[0][i][keys[0]] == obj[keys[0]]) {
            O.push(this[0][i]);
        }
    }
    return O;
}
JSONs.prototype.getValOf = function(key) {
    var v = [];
    for (var i in this[0]) {
        if (typeof this[0][i][key] != 'undefined') v.push(this[0][i][key]);
    }
    return v;
}
JSONs.prototype.getKeys = function(obj) {
    var k=[];
    for (var i in obj) { k.push(i) }
    return k;
}
JSONs.prototype.clone = function(obj){
    var clone = {};
    if(arguments.length == 1){
        for(var i in obj){
            clone[i] = obj[i];
        }
    }
    else{
        for(var i in this){
            clone[i] = this[i];
        }
    }
    return clone;
}
JSONs.prototype.join = function(obj){
    for(var i in obj){
        this[0][i] = obj[i];
    }
    return this[0];
}
String.ext = function (fun) {
    for (var fn in fun) {
        String.prototype[fn] = fun[fn];
    }
}

Array.ext = function (fun) {
    for (var fn in fun) {
        Array.prototype[fn] = fun[fn];
    }
}

Array.ext({
    removeDuplicate: function (op) {
        var op = $S.fun.obExt({
            targetChar: '',
            removeOp: 'normal' // normal | all
        }, op);
        
        var indx = 0, chr, dup = true;
        while (dup) {
            var chk = this.indexOf(this[indx], this.indexOf(this[indx]) + 1);
            var is_dup = { _: chk == -1 ? false : true, ind: chk };
            if (is_dup._ && (op.targetChar == this[is_dup.ind] || op.targetChar == "" )) this.splice(is_dup.ind, 1);
            else indx++;
            if (indx == this.length) {
                dup = false;
                if (op.removeOp == "all") this.splice(this.indexOf(op.targetChar), 1);
            }
        }
        return this;
    },
    last: function () {
        return this[this.length - 1];
    },
    first: function () {
        return this[0];
    },
    clean : function () {
		var a=[];
        for (var x = 0; x < this.length; x++) {
			if( this[x] != "" && this[x] != null && this[x] != undefined ){
				a.push(this[x]);
			}
        }
		return a;
    },
	split : function(op){
		var a = [], i, part;
		do{
			i = this.indexOf(op);
			part = this.splice(0, i != -1 ? i + 1 : this.length);
			if(part.indexOf(op) > -1)part.pop();
			a.push(part);
		}while(i != -1);
		return a;
	}
});

String.ext({
    replaceAll : function(to, by){
		for( var s = 0; s < this.length ; s++ ){
			var str = this;
			var rstr = str.replace(to, by);
			this.str = rstr;
			if( str == rstr ) break;
		}
		return this;
	}
});

/*var id_class = new RegExp('([#|.]?)([a-z A-Z 0-9]+[\\d+]?)');
var el;
var selArr = s.match(id_class);
if (selArr[1].toString() == '#') {
    el = document.getElementById(selArr[2].toString());
}
else if (selArr[1].toString() == '.') {
    el = ctx.getElementsByClassName(selArr[2].toString());
}
else if (selArr[1].toString() == '') {
    el = ctx.getElementsByTagName(selArr[0].toString());
}
//this.fun.len(el.length >= 0 ? el.length : el ? 1 : 0);
this.fun.len(el.length ? el.length : el ? 1 : 0);
if (el instanceof HTMLCollection && el.length == 1) {
    el = el[0];
}
return el;*/

// sizzle selector
/*! Sizzle v2.2.0-pre | (c) jQuery Foundation, Inc. | jquery.org/license */
!function (a) { var b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u = "sizzle" + 1 * new Date, v = a.document, w = 0, x = 0, y = gb(), z = gb(), A = gb(), B = function (a, b) { return a === b && (l = !0), 0 }, C = 1 << 31, D = {}.hasOwnProperty, E = [], F = E.pop, G = E.push, H = E.push, I = E.slice, J = function (a, b) { for (var c = 0, d = a.length; d > c; c++) if (a[c] === b) return c; return -1 }, K = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", L = "[\\x20\\t\\r\\n\\f]", M = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+", N = "\\[" + L + "*(" + M + ")(?:" + L + "*([*^$|!~]?=)" + L + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + M + "))|)" + L + "*\\]", O = ":(" + M + ")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|" + N + ")*)|.*)\\)|)", P = new RegExp(L + "+", "g"), Q = new RegExp("^" + L + "+|((?:^|[^\\\\])(?:\\\\.)*)" + L + "+$", "g"), R = new RegExp("^" + L + "*," + L + "*"), S = new RegExp("^" + L + "*([>+~]|" + L + ")" + L + "*"), T = new RegExp("=" + L + "*([^\\]'\"]*?)" + L + "*\\]", "g"), U = new RegExp(O), V = new RegExp("^" + M + "$"), W = { ID: new RegExp("^#(" + M + ")"), CLASS: new RegExp("^\\.(" + M + ")"), TAG: new RegExp("^(" + M + "|[*])"), ATTR: new RegExp("^" + N), PSEUDO: new RegExp("^" + O), CHILD: new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + L + "*(even|odd|(([+-]|)(\\d*)n|)" + L + "*(?:([+-]|)" + L + "*(\\d+)|))" + L + "*\\)|)", "i"), bool: new RegExp("^(?:" + K + ")$", "i"), needsContext: new RegExp("^" + L + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + L + "*((?:-\\d)?\\d*)" + L + "*\\)|)(?=[^-]|$)", "i") }, X = /^(?:input|select|textarea|button)$/i, Y = /^h\d$/i, Z = /^[^{]+\{\s*\[native \w/, $ = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, _ = /[+~]/, ab = /'|\\/g, bb = new RegExp("\\\\([\\da-f]{1,6}" + L + "?|(" + L + ")|.)", "ig"), cb = function (a, b, c) { var d = "0x" + b - 65536; return d !== d || c ? b : 0 > d ? String.fromCharCode(d + 65536) : String.fromCharCode(d >> 10 | 55296, 1023 & d | 56320) }, db = function () { m() }; try { H.apply(E = I.call(v.childNodes), v.childNodes), E[v.childNodes.length].nodeType } catch (eb) { H = { apply: E.length ? function (a, b) { G.apply(a, I.call(b)) } : function (a, b) { var c = a.length, d = 0; while (a[c++] = b[d++]); a.length = c - 1 } } } function fb(a, b, d, e) { var f, h, j, k, l, o, r, s, w, x; if (d = d || [], "string" != typeof a || !a || b && (k = b.nodeType) && 1 !== k && 9 !== k && 11 !== k) return d; if (!e && ((b ? b.ownerDocument || b : v) !== n && m(b), p)) { if (b = b || n, k = b.nodeType, 11 !== k && (f = $.exec(a))) if (j = f[1]) { if (9 === k) { if (h = b.getElementById(j), !h || !h.parentNode) return d; if (h.id === j) return d.push(h), d } else if (b.ownerDocument && (h = b.ownerDocument.getElementById(j)) && t(b, h) && h.id === j) return d.push(h), d } else { if (f[2]) return H.apply(d, b.getElementsByTagName(a)), d; if ((j = f[3]) && c.getElementsByClassName) return H.apply(d, b.getElementsByClassName(j)), d } if (!(!c.qsa || A[a + " "] || q && q.test(a))) { if (s = r = u, w = b, x = 1 !== k && a, 1 === k && "object" !== b.nodeName.toLowerCase()) { o = g(a), (r = b.getAttribute("id")) ? s = r.replace(ab, "\\$&") : b.setAttribute("id", s), s = "[id='" + s + "'] ", l = o.length; while (l--) o[l] = s + qb(o[l]); w = _.test(a) && ob(b.parentNode) || b, x = o.join(",") } if (x) try { return H.apply(d, w.querySelectorAll(x)), d } catch (y) { } finally { r || b.removeAttribute("id") } } } return i(a.replace(Q, "$1"), b, d, e) } function gb() { var a = []; function b(c, e) { return a.push(c + " ") > d.cacheLength && delete b[a.shift()], b[c + " "] = e } return b } function hb(a) { return a[u] = !0, a } function ib(a) { var b = n.createElement("div"); try { return !!a(b) } catch (c) { return !1 } finally { b.parentNode && b.parentNode.removeChild(b), b = null } } function jb(a, b) { var c = a.split("|"), e = a.length; while (e--) d.attrHandle[c[e]] = b } function kb(a, b) { var c = b && a, d = c && 1 === a.nodeType && 1 === b.nodeType && (~b.sourceIndex || C) - (~a.sourceIndex || C); if (d) return d; if (c) while (c = c.nextSibling) if (c === b) return -1; return a ? 1 : -1 } function lb(a) { return function (b) { var c = b.nodeName.toLowerCase(); return "input" === c && b.type === a } } function mb(a) { return function (b) { var c = b.nodeName.toLowerCase(); return ("input" === c || "button" === c) && b.type === a } } function nb(a) { return hb(function (b) { return b = +b, hb(function (c, d) { var e, f = a([], c.length, b), g = f.length; while (g--) c[e = f[g]] && (c[e] = !(d[e] = c[e])) }) }) } function ob(a) { return a && "undefined" != typeof a.getElementsByTagName && a } c = fb.support = {}, fb.expando = u, f = fb.isXML = function (a) { var b = a && (a.ownerDocument || a).documentElement; return b ? "HTML" !== b.nodeName : !1 }, m = fb.setDocument = function (a) { var b, e, g = a ? a.ownerDocument || a : v; return g !== n && 9 === g.nodeType && g.documentElement ? (n = g, o = g.documentElement, e = g.defaultView, e && e !== e.top && (e.addEventListener ? e.addEventListener("unload", db, !1) : e.attachEvent && e.attachEvent("onunload", db)), p = !f(g), c.attributes = ib(function (a) { return a.className = "i", !a.getAttribute("className") }), c.getElementsByTagName = ib(function (a) { return a.appendChild(g.createComment("")), !a.getElementsByTagName("*").length }), c.getElementsByClassName = Z.test(g.getElementsByClassName), c.getById = ib(function (a) { return o.appendChild(a).id = u, !g.getElementsByName || !g.getElementsByName(u).length }), c.getById ? (d.find.ID = function (a, b) { if ("undefined" != typeof b.getElementById && p) { var c = b.getElementById(a); return c && c.parentNode ? [c] : [] } }, d.filter.ID = function (a) { var b = a.replace(bb, cb); return function (a) { return a.getAttribute("id") === b } }) : (delete d.find.ID, d.filter.ID = function (a) { var b = a.replace(bb, cb); return function (a) { var c = "undefined" != typeof a.getAttributeNode && a.getAttributeNode("id"); return c && c.value === b } }), d.find.TAG = c.getElementsByTagName ? function (a, b) { return "undefined" != typeof b.getElementsByTagName ? b.getElementsByTagName(a) : c.qsa ? b.querySelectorAll(a) : void 0 } : function (a, b) { var c, d = [], e = 0, f = b.getElementsByTagName(a); if ("*" === a) { while (c = f[e++]) 1 === c.nodeType && d.push(c); return d } return f }, d.find.CLASS = c.getElementsByClassName && function (a, b) { return p ? b.getElementsByClassName(a) : void 0 }, r = [], q = [], (c.qsa = Z.test(g.querySelectorAll)) && (ib(function (a) { o.appendChild(a).innerHTML = "<a id='" + u + "'></a><select id='" + u + "-\r\\' msallowcapture=''><option selected=''></option></select>", a.querySelectorAll("[msallowcapture^='']").length && q.push("[*^$]=" + L + "*(?:''|\"\")"), a.querySelectorAll("[selected]").length || q.push("\\[" + L + "*(?:value|" + K + ")"), a.querySelectorAll("[id~=" + u + "-]").length || q.push("~="), a.querySelectorAll(":checked").length || q.push(":checked"), a.querySelectorAll("a#" + u + "+*").length || q.push(".#.+[+~]") }), ib(function (a) { var b = g.createElement("input"); b.setAttribute("type", "hidden"), a.appendChild(b).setAttribute("name", "D"), a.querySelectorAll("[name=d]").length && q.push("name" + L + "*[*^$|!~]?="), a.querySelectorAll(":enabled").length || q.push(":enabled", ":disabled"), a.querySelectorAll("*,:x"), q.push(",.*:") })), (c.matchesSelector = Z.test(s = o.matches || o.webkitMatchesSelector || o.mozMatchesSelector || o.oMatchesSelector || o.msMatchesSelector)) && ib(function (a) { c.disconnectedMatch = s.call(a, "div"), s.call(a, "[s!='']:x"), r.push("!=", O) }), q = q.length && new RegExp(q.join("|")), r = r.length && new RegExp(r.join("|")), b = Z.test(o.compareDocumentPosition), t = b || Z.test(o.contains) ? function (a, b) { var c = 9 === a.nodeType ? a.documentElement : a, d = b && b.parentNode; return a === d || !(!d || 1 !== d.nodeType || !(c.contains ? c.contains(d) : a.compareDocumentPosition && 16 & a.compareDocumentPosition(d))) } : function (a, b) { if (b) while (b = b.parentNode) if (b === a) return !0; return !1 }, B = b ? function (a, b) { if (a === b) return l = !0, 0; var d = !a.compareDocumentPosition - !b.compareDocumentPosition; return d ? d : (d = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) : 1, 1 & d || !c.sortDetached && b.compareDocumentPosition(a) === d ? a === g || a.ownerDocument === v && t(v, a) ? -1 : b === g || b.ownerDocument === v && t(v, b) ? 1 : k ? J(k, a) - J(k, b) : 0 : 4 & d ? -1 : 1) } : function (a, b) { if (a === b) return l = !0, 0; var c, d = 0, e = a.parentNode, f = b.parentNode, h = [a], i = [b]; if (!e || !f) return a === g ? -1 : b === g ? 1 : e ? -1 : f ? 1 : k ? J(k, a) - J(k, b) : 0; if (e === f) return kb(a, b); c = a; while (c = c.parentNode) h.unshift(c); c = b; while (c = c.parentNode) i.unshift(c); while (h[d] === i[d]) d++; return d ? kb(h[d], i[d]) : h[d] === v ? -1 : i[d] === v ? 1 : 0 }, g) : n }, fb.matches = function (a, b) { return fb(a, null, null, b) }, fb.matchesSelector = function (a, b) { if ((a.ownerDocument || a) !== n && m(a), b = b.replace(T, "='$1']"), !(!c.matchesSelector || !p || A[b + " "] || r && r.test(b) || q && q.test(b))) try { var d = s.call(a, b); if (d || c.disconnectedMatch || a.document && 11 !== a.document.nodeType) return d } catch (e) { } return fb(b, n, null, [a]).length > 0 }, fb.contains = function (a, b) { return (a.ownerDocument || a) !== n && m(a), t(a, b) }, fb.attr = function (a, b) { (a.ownerDocument || a) !== n && m(a); var e = d.attrHandle[b.toLowerCase()], f = e && D.call(d.attrHandle, b.toLowerCase()) ? e(a, b, !p) : void 0; return void 0 !== f ? f : c.attributes || !p ? a.getAttribute(b) : (f = a.getAttributeNode(b)) && f.specified ? f.value : null }, fb.error = function (a) { throw new Error("Syntax error, unrecognized expression: " + a) }, fb.uniqueSort = function (a) { var b, d = [], e = 0, f = 0; if (l = !c.detectDuplicates, k = !c.sortStable && a.slice(0), a.sort(B), l) { while (b = a[f++]) b === a[f] && (e = d.push(f)); while (e--) a.splice(d[e], 1) } return k = null, a }, e = fb.getText = function (a) { var b, c = "", d = 0, f = a.nodeType; if (f) { if (1 === f || 9 === f || 11 === f) { if ("string" == typeof a.textContent) return a.textContent; for (a = a.firstChild; a; a = a.nextSibling) c += e(a) } else if (3 === f || 4 === f) return a.nodeValue } else while (b = a[d++]) c += e(b); return c }, d = fb.selectors = { cacheLength: 50, createPseudo: hb, match: W, attrHandle: {}, find: {}, relative: { ">": { dir: "parentNode", first: !0 }, " ": { dir: "parentNode" }, "+": { dir: "previousSibling", first: !0 }, "~": { dir: "previousSibling" } }, preFilter: { ATTR: function (a) { return a[1] = a[1].replace(bb, cb), a[3] = (a[3] || a[4] || a[5] || "").replace(bb, cb), "~=" === a[2] && (a[3] = " " + a[3] + " "), a.slice(0, 4) }, CHILD: function (a) { return a[1] = a[1].toLowerCase(), "nth" === a[1].slice(0, 3) ? (a[3] || fb.error(a[0]), a[4] = +(a[4] ? a[5] + (a[6] || 1) : 2 * ("even" === a[3] || "odd" === a[3])), a[5] = +(a[7] + a[8] || "odd" === a[3])) : a[3] && fb.error(a[0]), a }, PSEUDO: function (a) { var b, c = !a[6] && a[2]; return W.CHILD.test(a[0]) ? null : (a[3] ? a[2] = a[4] || a[5] || "" : c && U.test(c) && (b = g(c, !0)) && (b = c.indexOf(")", c.length - b) - c.length) && (a[0] = a[0].slice(0, b), a[2] = c.slice(0, b)), a.slice(0, 3)) } }, filter: { TAG: function (a) { var b = a.replace(bb, cb).toLowerCase(); return "*" === a ? function () { return !0 } : function (a) { return a.nodeName && a.nodeName.toLowerCase() === b } }, CLASS: function (a) { var b = y[a + " "]; return b || (b = new RegExp("(^|" + L + ")" + a + "(" + L + "|$)")) && y(a, function (a) { return b.test("string" == typeof a.className && a.className || "undefined" != typeof a.getAttribute && a.getAttribute("class") || "") }) }, ATTR: function (a, b, c) { return function (d) { var e = fb.attr(d, a); return null == e ? "!=" === b : b ? (e += "", "=" === b ? e === c : "!=" === b ? e !== c : "^=" === b ? c && 0 === e.indexOf(c) : "*=" === b ? c && e.indexOf(c) > -1 : "$=" === b ? c && e.slice(-c.length) === c : "~=" === b ? (" " + e.replace(P, " ") + " ").indexOf(c) > -1 : "|=" === b ? e === c || e.slice(0, c.length + 1) === c + "-" : !1) : !0 } }, CHILD: function (a, b, c, d, e) { var f = "nth" !== a.slice(0, 3), g = "last" !== a.slice(-4), h = "of-type" === b; return 1 === d && 0 === e ? function (a) { return !!a.parentNode } : function (b, c, i) { var j, k, l, m, n, o, p = f !== g ? "nextSibling" : "previousSibling", q = b.parentNode, r = h && b.nodeName.toLowerCase(), s = !i && !h; if (q) { if (f) { while (p) { l = b; while (l = l[p]) if (h ? l.nodeName.toLowerCase() === r : 1 === l.nodeType) return !1; o = p = "only" === a && !o && "nextSibling" } return !0 } if (o = [g ? q.firstChild : q.lastChild], g && s) { k = q[u] || (q[u] = {}), j = k[a] || [], n = j[0] === w && j[1], m = j[0] === w && j[2], l = n && q.childNodes[n]; while (l = ++n && l && l[p] || (m = n = 0) || o.pop()) if (1 === l.nodeType && ++m && l === b) { k[a] = [w, n, m]; break } } else if (s && (j = (b[u] || (b[u] = {}))[a]) && j[0] === w) m = j[1]; else while (l = ++n && l && l[p] || (m = n = 0) || o.pop()) if ((h ? l.nodeName.toLowerCase() === r : 1 === l.nodeType) && ++m && (s && ((l[u] || (l[u] = {}))[a] = [w, m]), l === b)) break; return m -= e, m === d || m % d === 0 && m / d >= 0 } } }, PSEUDO: function (a, b) { var c, e = d.pseudos[a] || d.setFilters[a.toLowerCase()] || fb.error("unsupported pseudo: " + a); return e[u] ? e(b) : e.length > 1 ? (c = [a, a, "", b], d.setFilters.hasOwnProperty(a.toLowerCase()) ? hb(function (a, c) { var d, f = e(a, b), g = f.length; while (g--) d = J(a, f[g]), a[d] = !(c[d] = f[g]) }) : function (a) { return e(a, 0, c) }) : e } }, pseudos: { not: hb(function (a) { var b = [], c = [], d = h(a.replace(Q, "$1")); return d[u] ? hb(function (a, b, c, e) { var f, g = d(a, null, e, []), h = a.length; while (h--) (f = g[h]) && (a[h] = !(b[h] = f)) }) : function (a, e, f) { return b[0] = a, d(b, null, f, c), b[0] = null, !c.pop() } }), has: hb(function (a) { return function (b) { return fb(a, b).length > 0 } }), contains: hb(function (a) { return a = a.replace(bb, cb), function (b) { return (b.textContent || b.innerText || e(b)).indexOf(a) > -1 } }), lang: hb(function (a) { return V.test(a || "") || fb.error("unsupported lang: " + a), a = a.replace(bb, cb).toLowerCase(), function (b) { var c; do if (c = p ? b.lang : b.getAttribute("xml:lang") || b.getAttribute("lang")) return c = c.toLowerCase(), c === a || 0 === c.indexOf(a + "-"); while ((b = b.parentNode) && 1 === b.nodeType); return !1 } }), target: function (b) { var c = a.location && a.location.hash; return c && c.slice(1) === b.id }, root: function (a) { return a === o }, focus: function (a) { return a === n.activeElement && (!n.hasFocus || n.hasFocus()) && !!(a.type || a.href || ~a.tabIndex) }, enabled: function (a) { return a.disabled === !1 }, disabled: function (a) { return a.disabled === !0 }, checked: function (a) { var b = a.nodeName.toLowerCase(); return "input" === b && !!a.checked || "option" === b && !!a.selected }, selected: function (a) { return a.parentNode && a.parentNode.selectedIndex, a.selected === !0 }, empty: function (a) { for (a = a.firstChild; a; a = a.nextSibling) if (a.nodeType < 6) return !1; return !0 }, parent: function (a) { return !d.pseudos.empty(a) }, header: function (a) { return Y.test(a.nodeName) }, input: function (a) { return X.test(a.nodeName) }, button: function (a) { var b = a.nodeName.toLowerCase(); return "input" === b && "button" === a.type || "button" === b }, text: function (a) { var b; return "input" === a.nodeName.toLowerCase() && "text" === a.type && (null == (b = a.getAttribute("type")) || "text" === b.toLowerCase()) }, first: nb(function () { return [0] }), last: nb(function (a, b) { return [b - 1] }), eq: nb(function (a, b, c) { return [0 > c ? c + b : c] }), even: nb(function (a, b) { for (var c = 0; b > c; c += 2) a.push(c); return a }), odd: nb(function (a, b) { for (var c = 1; b > c; c += 2) a.push(c); return a }), lt: nb(function (a, b, c) { for (var d = 0 > c ? c + b : c; --d >= 0;) a.push(d); return a }), gt: nb(function (a, b, c) { for (var d = 0 > c ? c + b : c; ++d < b;) a.push(d); return a }) } }, d.pseudos.nth = d.pseudos.eq; for (b in { radio: !0, checkbox: !0, file: !0, password: !0, image: !0 }) d.pseudos[b] = lb(b); for (b in { submit: !0, reset: !0 }) d.pseudos[b] = mb(b); function pb() { } pb.prototype = d.filters = d.pseudos, d.setFilters = new pb, g = fb.tokenize = function (a, b) { var c, e, f, g, h, i, j, k = z[a + " "]; if (k) return b ? 0 : k.slice(0); h = a, i = [], j = d.preFilter; while (h) { (!c || (e = R.exec(h))) && (e && (h = h.slice(e[0].length) || h), i.push(f = [])), c = !1, (e = S.exec(h)) && (c = e.shift(), f.push({ value: c, type: e[0].replace(Q, " ") }), h = h.slice(c.length)); for (g in d.filter) !(e = W[g].exec(h)) || j[g] && !(e = j[g](e)) || (c = e.shift(), f.push({ value: c, type: g, matches: e }), h = h.slice(c.length)); if (!c) break } return b ? h.length : h ? fb.error(a) : z(a, i).slice(0) }; function qb(a) { for (var b = 0, c = a.length, d = ""; c > b; b++) d += a[b].value; return d } function rb(a, b, c) { var d = b.dir, e = c && "parentNode" === d, f = x++; return b.first ? function (b, c, f) { while (b = b[d]) if (1 === b.nodeType || e) return a(b, c, f) } : function (b, c, g) { var h, i, j = [w, f]; if (g) { while (b = b[d]) if ((1 === b.nodeType || e) && a(b, c, g)) return !0 } else while (b = b[d]) if (1 === b.nodeType || e) { if (i = b[u] || (b[u] = {}), (h = i[d]) && h[0] === w && h[1] === f) return j[2] = h[2]; if (i[d] = j, j[2] = a(b, c, g)) return !0 } } } function sb(a) { return a.length > 1 ? function (b, c, d) { var e = a.length; while (e--) if (!a[e](b, c, d)) return !1; return !0 } : a[0] } function tb(a, b, c) { for (var d = 0, e = b.length; e > d; d++) fb(a, b[d], c); return c } function ub(a, b, c, d, e) { for (var f, g = [], h = 0, i = a.length, j = null != b; i > h; h++) (f = a[h]) && (!c || c(f, d, e)) && (g.push(f), j && b.push(h)); return g } function vb(a, b, c, d, e, f) { return d && !d[u] && (d = vb(d)), e && !e[u] && (e = vb(e, f)), hb(function (f, g, h, i) { var j, k, l, m = [], n = [], o = g.length, p = f || tb(b || "*", h.nodeType ? [h] : h, []), q = !a || !f && b ? p : ub(p, m, a, h, i), r = c ? e || (f ? a : o || d) ? [] : g : q; if (c && c(q, r, h, i), d) { j = ub(r, n), d(j, [], h, i), k = j.length; while (k--) (l = j[k]) && (r[n[k]] = !(q[n[k]] = l)) } if (f) { if (e || a) { if (e) { j = [], k = r.length; while (k--) (l = r[k]) && j.push(q[k] = l); e(null, r = [], j, i) } k = r.length; while (k--) (l = r[k]) && (j = e ? J(f, l) : m[k]) > -1 && (f[j] = !(g[j] = l)) } } else r = ub(r === g ? r.splice(o, r.length) : r), e ? e(null, g, r, i) : H.apply(g, r) }) } function wb(a) { for (var b, c, e, f = a.length, g = d.relative[a[0].type], h = g || d.relative[" "], i = g ? 1 : 0, k = rb(function (a) { return a === b }, h, !0), l = rb(function (a) { return J(b, a) > -1 }, h, !0), m = [function (a, c, d) { var e = !g && (d || c !== j) || ((b = c).nodeType ? k(a, c, d) : l(a, c, d)); return b = null, e }]; f > i; i++) if (c = d.relative[a[i].type]) m = [rb(sb(m), c)]; else { if (c = d.filter[a[i].type].apply(null, a[i].matches), c[u]) { for (e = ++i; f > e; e++) if (d.relative[a[e].type]) break; return vb(i > 1 && sb(m), i > 1 && qb(a.slice(0, i - 1).concat({ value: " " === a[i - 2].type ? "*" : "" })).replace(Q, "$1"), c, e > i && wb(a.slice(i, e)), f > e && wb(a = a.slice(e)), f > e && qb(a)) } m.push(c) } return sb(m) } function xb(a, b) { var c = b.length > 0, e = a.length > 0, f = function (f, g, h, i, k) { var l, o, p, q = 0, r = "0", s = f && [], t = [], u = j, v = f || e && d.find.TAG("*", k), x = w += null == u ? 1 : Math.random() || .1, y = v.length; for (k && (j = g !== n && g) ; r !== y && null != (l = v[r]) ; r++) { if (e && l) { o = 0, g || (l.ownerDocument || l) === n || (m(l), g = n); while (p = a[o++]) if (p(l, g, h)) { i.push(l); break } k && (w = x) } c && ((l = !p && l) && q--, f && s.push(l)) } if (q += r, c && r !== q) { o = 0; while (p = b[o++]) p(s, t, g, h); if (f) { if (q > 0) while (r--) s[r] || t[r] || (t[r] = F.call(i)); t = ub(t) } H.apply(i, t), k && !f && t.length > 0 && q + b.length > 1 && fb.uniqueSort(i) } return k && (w = x, j = u), s }; return c ? hb(f) : f } h = fb.compile = function (a, b) { var c, d = [], e = [], f = A[a + " "]; if (!f) { b || (b = g(a)), c = b.length; while (c--) f = wb(b[c]), f[u] ? d.push(f) : e.push(f); f = A(a, xb(e, d)), f.selector = a } return f }, i = fb.select = function (a, b, e, f) { var i, j, k, l, m, n = "function" == typeof a && a, o = !f && g(a = n.selector || a); if (e = e || [], 1 === o.length) { if (j = o[0] = o[0].slice(0), j.length > 2 && "ID" === (k = j[0]).type && c.getById && 9 === b.nodeType && p && d.relative[j[1].type]) { if (b = (d.find.ID(k.matches[0].replace(bb, cb), b) || [])[0], !b) return e; n && (b = b.parentNode), a = a.slice(j.shift().value.length) } i = W.needsContext.test(a) ? 0 : j.length; while (i--) { if (k = j[i], d.relative[l = k.type]) break; if ((m = d.find[l]) && (f = m(k.matches[0].replace(bb, cb), _.test(j[0].type) && ob(b.parentNode) || b))) { if (j.splice(i, 1), a = f.length && qb(j), !a) return H.apply(e, f), e; break } } } return (n || h(a, o))(f, b, !p, e, _.test(a) && b && ob(b.parentNode) || b), e }, c.sortStable = u.split("").sort(B).join("") === u, c.detectDuplicates = !!l, m(), c.sortDetached = ib(function (a) { return 1 & a.compareDocumentPosition(n.createElement("div")) }), ib(function (a) { return a.innerHTML = "<a href='#'></a>", "#" === a.firstChild.getAttribute("href") }) || jb("type|href|height|width", function (a, b, c) { return c ? void 0 : a.getAttribute(b, "type" === b.toLowerCase() ? 1 : 2) }), c.attributes && ib(function (a) { return a.innerHTML = "<input/>", a.firstChild.setAttribute("value", ""), "" === a.firstChild.getAttribute("value") }) || jb("value", function (a, b, c) { return c || "input" !== a.nodeName.toLowerCase() ? void 0 : a.defaultValue }), ib(function (a) { return null == a.getAttribute("disabled") }) || jb(K, function (a, b, c) { var d; return c ? void 0 : a[b] === !0 ? b.toLowerCase() : (d = a.getAttributeNode(b)) && d.specified ? d.value : null }), "function" == typeof define && define.amd ? define(function () { return fb }) : "undefined" != typeof module && module.exports ? module.exports = fb : a.Sizzle = fb }(window);
