/*
 * jSymbolic javaScript Library v1.0 Beta
 * Copyright 2015, Yogesh Jagdale
 * http://www.jsymbolic.com
 * 
 * Includes Sizzle.js (c) jQuery Foundation, Inc.
 * http://sizzlejs.com/
 *
 * Includes VelocityJS (1.2.3). (C) 2014 Julian Shapiro.
 * http://velocityjs.org
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
    var jSymbolic = function (sel, symbols, op) {
        var j = new jSymbolic.fun._(sel, symbols, op);
        return typeof j.return == type.undefined ? j : j.return;
    };
    jSymbolic.fun = jSymbolic.prototype = {
        _: function (sel, symbols, op) { // the parameter op : it is used for callback function and symbols : it is used for the assign symbols
			var args = arguments;//
            if (!this.mainCtx) { // fallback for next _js initialization
                sel ? this.mainSelector = sel : sel;
                symbols ? this.symbols = symbols : symbols;
                op ? this.op = op : op;
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
                this.return = null; // asign null to return, for next time when $S._ function initiate.
                this.symbols = args[0];
                this.op = args[1];
            }
            this.IFC = false; // Internal function calling
            this.symbols ? this.sym_to_fn() : this.symbols;
            //this.splice = [].splice;
            return this.oldObject ? this.return ? this.return : this : this;
        },
        sym_to_fn: function () {
            var fn = this.filterSymbols(this.symbols, this.op);
            this.for(fn, function(a,b,c){
                this.fn = a; // getting function set
                var ele = this.getEle();
                if(!this.fn.param){ // standalone symbol
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
                    if (typeof udef[dkey[p]] != type.undefined ){
                        def[dkey[p]] = udef[dkey[p]];
                    }
                }
                return def;
            }
            else return def;
        }
    };
    jSymbolic.ext = function (extFun) {
        for (var fun in extFun) {
            this.prototype[fun] = extFun[fun];
        }
    }
    /* symbol function which used by symbol character end  */

    jSymbolic.ext({
        nxt: function (e) {
            e.nextSibling.nodeType == 3 ? e = e.nextSibling.nextSibling : e = e.nextSibling;
            if (!this.IFC) e ? this.subCtx.push(e) : e; else return e;
        },
        prev: function (e) {
            e.previousSibling.nodeType == 3 ? e = e.previousSibling.previousSibling : e = e.previousSibling;
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
                if ((args.indexOf('=') == -1 || args.indexOf(':') == -1) && typeof obj != type.undefined ){
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
            /*attr = this.formateArg(attr, obj);
            var html = this.htmlStr(e, "i"); // i is for to retrive innerHTML of element
            attr = {innerHTML : html}
            this.setReturn(e, attr);*/
            this.el(e, "innerHTML", obj);
        },
        IFC_: function (e, fun, sel, op) {
            this.IFC = true;
            var el = this[fun](e, sel, op);
            this.IFC = false;
            return el;
        },
        addSymbols: function (s) {
            jSymbolic.fun.symToLogicMaping = { length:0 };
            for (var ef in s) {
                am.push.call(jSymbolic.fun.symToLogicMaping, s[ef]);
            }
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
                evObj.callback = args[1] != undefined ? op[args[1]] != undefined ? op[args[1]] : args[1] : args[1];
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
    

    jSymbolic.fun.addSymbols({
        el : { fun: 'el', symbol: 'e', symType: 'opt'},                                                 // return all properties of element 
        fn : { fun: '$', symbol: '$', symType: 'function'},                                             // executable function
        eachfn : { fun: '$each', symbol: '$*', symType: 'function'},                                    // executable function
        html: { fun: 'ehtml', symbol: '</>', symPara: 'MULTI', symType: 'opt'},                         // get innerHtml or outerHtml
        nxt: { fun: 'nxt', symbol: '>', symPara: 'MONO', symType: 'context' },                          // next
        prev: { fun: 'prev', symbol: '<', symPara: 'MONO', symType: 'context' },                        // previous
        parent: { fun: 'parent', symbol: '^', symPara: 'MONO', symType: 'context' },                    // parent
        after: { fun: 'after', symbol: '>|', symPara: 'MULTI', symType: 'opt' },                        // after
        before: { fun: 'before', symbol: '|<', symPara: 'MULTI', symType: 'opt' },                      // before
        find: { fun: 'find', symbol: '?', symPara: 'MULTI', symType: 'context' },                       // find
        indx: { fun: 'indx', symbol: '!', symPara: 'MULTI', symType: 'index' },                         // find within collection by index
        sbls: { fun: 'sbls', symbol: '~', symPara: 'MONO', symType: 'context' },                        // siblings
        childs: { fun: 'childs', symbol: '<>', symPara: 'exe', symType: 'context' },                    // childrens
        append: { fun: 'append', symbol: '>+', symPara: 'MULTI', symType: 'opt' },                      // append
        prepend: { fun: 'prepend', symbol: '+<', symPara: 'MULTI', symType: 'opt' },                    // prepend
        height: { fun: 'height', symbol: '|', symPara: 'MONO' },                                        // height
        width: { fun: 'width', symbol: '_', symPara: 'MONO', },                                         // width
        remove: { fun: 'remove', symbol: 'x', symPara: 'exe', symType: 'opt' },                         // remove
        clone: { fun: 'clone', symbol: '||', symPara: 'context', symType: 'opt' },                      // clone
        reduceCtx: { fun: 'reduceCtx', symbol: '.', symPara: 'exe', symType: 'rctx' },                  // poping the context from mainCtx
        attr: { fun: 'attr', symbol: '@', symPara: 'MULTI', symFor: '+', symType: 'opt' },              // add attribute
        removeAttr: { fun: 'attr', symbol: '@x', symPara: 'MULTI', symFor: 'x', symType: 'opt' },       // remove attribute
        css: { fun: 'css', symbol: '&', symPara: 'MULTI', symType: 'opt' },                             // CSS
        addClass: { fun: '_class', symbol: '&+', symPara: 'MULTI', symType: 'opt', symFor: '+' },       // add CSS class
        removeClass: { fun: '_class', symbol: '&x', symPara: 'MULTI', symType: 'opt', symFor: 'x' },    // remove CSS class
        bindEvent: { fun: 'symEvent', symbol: '+=', symPara: 'MULTI', symType: 'opt' },                 // bind event
        unbindEvent: { fun: 'symEvent', symbol: '-=', symPara: 'MULTI', symType: 'opt' },               // unbind event
        fst_by_indx: { fun: 'fst_by_indx', symbol: '>Rx{\d+}', symPara: 'MONO-MULTI', symType: 'opt' }, // finding elements from 1 to end using index
        lst_by_indx: { fun: 'lst_by_indx', symbol: '<Rx{\d+}', symPara: 'MONO-MULTI', symType: 'opt' }, // finding elements from last to first elements using index
        dataset : { fun: 'dataset', symbol: '#', symPara: 'MULTI', symType: 'opt' },                    // manipulating html5's dataset
        text : { fun: 'text', symbol: ',', symType: 'opt' },                                            // retrive text from element
        load : { fun: 'load', symbol: ':)', symPara: 'MULTI', symType: 'opt' }                          // jSymbolic exclusive symbol for DOM load event
    });
    
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
                var attrs = attr[at].split(/=|:/);
                if(attrs.length == 1){
                    if(!aryJSONstr.val)aryJSONstr.val = {};
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
        deepTrim: function(str){},
        setReturn: function(e, values){
            if(arguments.length != 2)throw "setReturn require 2 arguments";
            var i = 0, val = [], vl = {};
            !this.returnVal ? this.returnVal = [] : this.returnVal;
            if(this.returnVal.length == 0){
                vl.el = e;
                vl.val = values;
                this.returnVal.push(vl);
            }else{
                var r = new JSONs(this.returnVal).getValOf('el');
                this.for(e, function(e){
                    var br = false;
                    if(r.indexOf(e) > -1){ // check if element is already took for return;
                        this.for(this.returnVal, function(a,b,c,loop){
                            this.forEach(a, function(x,y,z,loop1){
                                if(y == 'el' && a.el == e){
                                    a.val = new JSONs(a.val).join(values); // copy one json into another json
                                    br = true;
                                }
                                if(br)loop1.break = true;
                            });
                            if(br)loop.break = true;
                        });
                    }else{ // else init freshly 
                        vl.el = e;
                        vl.val = values;
                        this.returnVal.push(vl);
                    }
                });
            }
            if(this.returnVal.length == 1){
                this.forEach(this.returnVal[0].val, function(a, b, c){
                    if(i > 1)Break=true;else i++;
                    val.push(a);
                });
                /*for(var prop in this.returnVal[0].val){
                    if(i > 1)break;else i++;
                    val.push(this.returnVal[0].val[prop]);
                }*/
                if(i==1) this.return = val[0];
                else if(i > 1) this.return = this.returnVal[0].val;
            }else{
                this.return = this.returnVal;
            }
        }
    });
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

/*! VelocityJS.org (1.2.3). (C) 2014 Julian Shapiro. MIT @license:  */
/*! VelocityJS.org jQuery Shim (1.0.1). (C) 2014 The jQuery Foundation. MIT @license: en.wikipedia.org/wiki/MIT_License. */
!function(a){function b(a){var b=a.length,d=c.type(a);return"function"===d||c.isWindow(a)?!1:1===a.nodeType&&b?!0:"array"===d||0===b||"number"==typeof b&&b>0&&b-1 in a}if(!a.jQuery){var c=function(a,b){return new c.fn.init(a,b)};c.isWindow=function(a){return null!=a&&a==a.window},c.type=function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?e[g.call(a)]||"object":typeof a},c.isArray=Array.isArray||function(a){return"array"===c.type(a)},c.isPlainObject=function(a){var b;if(!a||"object"!==c.type(a)||a.nodeType||c.isWindow(a))return!1;try{if(a.constructor&&!f.call(a,"constructor")&&!f.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(d){return!1}for(b in a);return void 0===b||f.call(a,b)},c.each=function(a,c,d){var e,f=0,g=a.length,h=b(a);if(d){if(h)for(;g>f&&(e=c.apply(a[f],d),e!==!1);f++);else for(f in a)if(e=c.apply(a[f],d),e===!1)break}else if(h)for(;g>f&&(e=c.call(a[f],f,a[f]),e!==!1);f++);else for(f in a)if(e=c.call(a[f],f,a[f]),e===!1)break;return a},c.data=function(a,b,e){if(void 0===e){var f=a[c.expando],g=f&&d[f];if(void 0===b)return g;if(g&&b in g)return g[b]}else if(void 0!==b){var f=a[c.expando]||(a[c.expando]=++c.uuid);return d[f]=d[f]||{},d[f][b]=e,e}},c.removeData=function(a,b){var e=a[c.expando],f=e&&d[e];f&&c.each(b,function(a,b){delete f[b]})},c.extend=function(){var a,b,d,e,f,g,h=arguments[0]||{},i=1,j=arguments.length,k=!1;for("boolean"==typeof h&&(k=h,h=arguments[i]||{},i++),"object"!=typeof h&&"function"!==c.type(h)&&(h={}),i===j&&(h=this,i--);j>i;i++)if(null!=(f=arguments[i]))for(e in f)a=h[e],d=f[e],h!==d&&(k&&d&&(c.isPlainObject(d)||(b=c.isArray(d)))?(b?(b=!1,g=a&&c.isArray(a)?a:[]):g=a&&c.isPlainObject(a)?a:{},h[e]=c.extend(k,g,d)):void 0!==d&&(h[e]=d));return h},c.queue=function(a,d,e){function f(a,c){var d=c||[];return null!=a&&(b(Object(a))?!function(a,b){for(var c=+b.length,d=0,e=a.length;c>d;)a[e++]=b[d++];if(c!==c)for(;void 0!==b[d];)a[e++]=b[d++];return a.length=e,a}(d,"string"==typeof a?[a]:a):[].push.call(d,a)),d}if(a){d=(d||"fx")+"queue";var g=c.data(a,d);return e?(!g||c.isArray(e)?g=c.data(a,d,f(e)):g.push(e),g):g||[]}},c.dequeue=function(a,b){c.each(a.nodeType?[a]:a,function(a,d){b=b||"fx";var e=c.queue(d,b),f=e.shift();"inprogress"===f&&(f=e.shift()),f&&("fx"===b&&e.unshift("inprogress"),f.call(d,function(){c.dequeue(d,b)}))})},c.fn=c.prototype={init:function(a){if(a.nodeType)return this[0]=a,this;throw new Error("Not a DOM node.")},offset:function(){var b=this[0].getBoundingClientRect?this[0].getBoundingClientRect():{top:0,left:0};return{top:b.top+(a.pageYOffset||document.scrollTop||0)-(document.clientTop||0),left:b.left+(a.pageXOffset||document.scrollLeft||0)-(document.clientLeft||0)}},position:function(){function a(){for(var a=this.offsetParent||document;a&&"html"===!a.nodeType.toLowerCase&&"static"===a.style.position;)a=a.offsetParent;return a||document}var b=this[0],a=a.apply(b),d=this.offset(),e=/^(?:body|html)$/i.test(a.nodeName)?{top:0,left:0}:c(a).offset();return d.top-=parseFloat(b.style.marginTop)||0,d.left-=parseFloat(b.style.marginLeft)||0,a.style&&(e.top+=parseFloat(a.style.borderTopWidth)||0,e.left+=parseFloat(a.style.borderLeftWidth)||0),{top:d.top-e.top,left:d.left-e.left}}};var d={};c.expando="velocity"+(new Date).getTime(),c.uuid=0;for(var e={},f=e.hasOwnProperty,g=e.toString,h="Boolean Number String Function Array Date RegExp Object Error".split(" "),i=0;i<h.length;i++)e["[object "+h[i]+"]"]=h[i].toLowerCase();c.fn.init.prototype=c.fn,a.Velocity={Utilities:c}}}(window),function(a){"object"==typeof module&&"object"==typeof module.exports?module.exports=a():"function"==typeof define&&define.amd?define(a):a()}(function(){return function(a,b,c,d){function e(a){for(var b=-1,c=a?a.length:0,d=[];++b<c;){var e=a[b];e&&d.push(e)}return d}function f(a){return p.isWrapped(a)?a=[].slice.call(a):p.isNode(a)&&(a=[a]),a}function g(a){var b=m.data(a,"velocity");return null===b?d:b}function h(a){return function(b){return Math.round(b*a)*(1/a)}}function i(a,c,d,e){function f(a,b){return 1-3*b+3*a}function g(a,b){return 3*b-6*a}function h(a){return 3*a}function i(a,b,c){return((f(b,c)*a+g(b,c))*a+h(b))*a}function j(a,b,c){return 3*f(b,c)*a*a+2*g(b,c)*a+h(b)}function k(b,c){for(var e=0;p>e;++e){var f=j(c,a,d);if(0===f)return c;var g=i(c,a,d)-b;c-=g/f}return c}function l(){for(var b=0;t>b;++b)x[b]=i(b*u,a,d)}function m(b,c,e){var f,g,h=0;do g=c+(e-c)/2,f=i(g,a,d)-b,f>0?e=g:c=g;while(Math.abs(f)>r&&++h<s);return g}function n(b){for(var c=0,e=1,f=t-1;e!=f&&x[e]<=b;++e)c+=u;--e;var g=(b-x[e])/(x[e+1]-x[e]),h=c+g*u,i=j(h,a,d);return i>=q?k(b,h):0==i?h:m(b,c,c+u)}function o(){y=!0,(a!=c||d!=e)&&l()}var p=4,q=.001,r=1e-7,s=10,t=11,u=1/(t-1),v="Float32Array"in b;if(4!==arguments.length)return!1;for(var w=0;4>w;++w)if("number"!=typeof arguments[w]||isNaN(arguments[w])||!isFinite(arguments[w]))return!1;a=Math.min(a,1),d=Math.min(d,1),a=Math.max(a,0),d=Math.max(d,0);var x=v?new Float32Array(t):new Array(t),y=!1,z=function(b){return y||o(),a===c&&d===e?b:0===b?0:1===b?1:i(n(b),c,e)};z.getControlPoints=function(){return[{x:a,y:c},{x:d,y:e}]};var A="generateBezier("+[a,c,d,e]+")";return z.toString=function(){return A},z}function j(a,b){var c=a;return p.isString(a)?t.Easings[a]||(c=!1):c=p.isArray(a)&&1===a.length?h.apply(null,a):p.isArray(a)&&2===a.length?u.apply(null,a.concat([b])):p.isArray(a)&&4===a.length?i.apply(null,a):!1,c===!1&&(c=t.Easings[t.defaults.easing]?t.defaults.easing:s),c}function k(a){if(a){var b=(new Date).getTime(),c=t.State.calls.length;c>1e4&&(t.State.calls=e(t.State.calls));for(var f=0;c>f;f++)if(t.State.calls[f]){var h=t.State.calls[f],i=h[0],j=h[2],n=h[3],o=!!n,q=null;n||(n=t.State.calls[f][3]=b-16);for(var r=Math.min((b-n)/j.duration,1),s=0,u=i.length;u>s;s++){var w=i[s],y=w.element;if(g(y)){var z=!1;if(j.display!==d&&null!==j.display&&"none"!==j.display){if("flex"===j.display){var A=["-webkit-box","-moz-box","-ms-flexbox","-webkit-flex"];m.each(A,function(a,b){v.setPropertyValue(y,"display",b)})}v.setPropertyValue(y,"display",j.display)}j.visibility!==d&&"hidden"!==j.visibility&&v.setPropertyValue(y,"visibility",j.visibility);for(var B in w)if("element"!==B){var C,D=w[B],E=p.isString(D.easing)?t.Easings[D.easing]:D.easing;if(1===r)C=D.endValue;else{var F=D.endValue-D.startValue;if(C=D.startValue+F*E(r,j,F),!o&&C===D.currentValue)continue}if(D.currentValue=C,"tween"===B)q=C;else{if(v.Hooks.registered[B]){var G=v.Hooks.getRoot(B),H=g(y).rootPropertyValueCache[G];H&&(D.rootPropertyValue=H)}var I=v.setPropertyValue(y,B,D.currentValue+(0===parseFloat(C)?"":D.unitType),D.rootPropertyValue,D.scrollData);v.Hooks.registered[B]&&(g(y).rootPropertyValueCache[G]=v.Normalizations.registered[G]?v.Normalizations.registered[G]("extract",null,I[1]):I[1]),"transform"===I[0]&&(z=!0)}}j.mobileHA&&g(y).transformCache.translate3d===d&&(g(y).transformCache.translate3d="(0px, 0px, 0px)",z=!0),z&&v.flushTransformCache(y)}}j.display!==d&&"none"!==j.display&&(t.State.calls[f][2].display=!1),j.visibility!==d&&"hidden"!==j.visibility&&(t.State.calls[f][2].visibility=!1),j.progress&&j.progress.call(h[1],h[1],r,Math.max(0,n+j.duration-b),n,q),1===r&&l(f)}}t.State.isTicking&&x(k)}function l(a,b){if(!t.State.calls[a])return!1;for(var c=t.State.calls[a][0],e=t.State.calls[a][1],f=t.State.calls[a][2],h=t.State.calls[a][4],i=!1,j=0,k=c.length;k>j;j++){var l=c[j].element;if(b||f.loop||("none"===f.display&&v.setPropertyValue(l,"display",f.display),"hidden"===f.visibility&&v.setPropertyValue(l,"visibility",f.visibility)),f.loop!==!0&&(m.queue(l)[1]===d||!/\.velocityQueueEntryFlag/i.test(m.queue(l)[1]))&&g(l)){g(l).isAnimating=!1,g(l).rootPropertyValueCache={};var n=!1;m.each(v.Lists.transforms3D,function(a,b){var c=/^scale/.test(b)?1:0,e=g(l).transformCache[b];g(l).transformCache[b]!==d&&new RegExp("^\\("+c+"[^.]").test(e)&&(n=!0,delete g(l).transformCache[b])}),f.mobileHA&&(n=!0,delete g(l).transformCache.translate3d),n&&v.flushTransformCache(l),v.Values.removeClass(l,"velocity-animating")}if(!b&&f.complete&&!f.loop&&j===k-1)try{f.complete.call(e,e)}catch(o){setTimeout(function(){throw o},1)}h&&f.loop!==!0&&h(e),g(l)&&f.loop===!0&&!b&&(m.each(g(l).tweensContainer,function(a,b){/^rotate/.test(a)&&360===parseFloat(b.endValue)&&(b.endValue=0,b.startValue=360),/^backgroundPosition/.test(a)&&100===parseFloat(b.endValue)&&"%"===b.unitType&&(b.endValue=0,b.startValue=100)}),t(l,"reverse",{loop:!0,delay:f.delay})),f.queue!==!1&&m.dequeue(l,f.queue)}t.State.calls[a]=!1;for(var p=0,q=t.State.calls.length;q>p;p++)if(t.State.calls[p]!==!1){i=!0;break}i===!1&&(t.State.isTicking=!1,delete t.State.calls,t.State.calls=[])}var m,n=function(){if(c.documentMode)return c.documentMode;for(var a=7;a>4;a--){var b=c.createElement("div");if(b.innerHTML="<!--[if IE "+a+"]><span></span><![endif]-->",b.getElementsByTagName("span").length)return b=null,a}return d}(),o=function(){var a=0;return b.webkitRequestAnimationFrame||b.mozRequestAnimationFrame||function(b){var c,d=(new Date).getTime();return c=Math.max(0,16-(d-a)),a=d+c,setTimeout(function(){b(d+c)},c)}}(),p={isString:function(a){return"string"==typeof a},isArray:Array.isArray||function(a){return"[object Array]"===Object.prototype.toString.call(a)},isFunction:function(a){return"[object Function]"===Object.prototype.toString.call(a)},isNode:function(a){return a&&a.nodeType},isNodeList:function(a){return"object"==typeof a&&/^\[object (HTMLCollection|NodeList|Object)\]$/.test(Object.prototype.toString.call(a))&&a.length!==d&&(0===a.length||"object"==typeof a[0]&&a[0].nodeType>0)},isWrapped:function(a){return a&&(a.jquery||b.Zepto&&b.Zepto.zepto.isZ(a))},isSVG:function(a){return b.SVGElement&&a instanceof b.SVGElement},isEmptyObject:function(a){for(var b in a)return!1;return!0}},q=!1;if(a.fn&&a.fn.jquery?(m=a,q=!0):m=b.Velocity.Utilities,8>=n&&!q)throw new Error("Velocity: IE8 and below require jQuery to be loaded before Velocity.");if(7>=n)return void(jQuery.fn.velocity=jQuery.fn.animate);var r=400,s="swing",t={State:{isMobile:/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),isAndroid:/Android/i.test(navigator.userAgent),isGingerbread:/Android 2\.3\.[3-7]/i.test(navigator.userAgent),isChrome:b.chrome,isFirefox:/Firefox/i.test(navigator.userAgent),prefixElement:c.createElement("div"),prefixMatches:{},scrollAnchor:null,scrollPropertyLeft:null,scrollPropertyTop:null,isTicking:!1,calls:[]},CSS:{},Utilities:m,Redirects:{},Easings:{},Promise:b.Promise,defaults:{queue:"",duration:r,easing:s,begin:d,complete:d,progress:d,display:d,visibility:d,loop:!1,delay:!1,mobileHA:!0,_cacheValues:!0},init:function(a){m.data(a,"velocity",{isSVG:p.isSVG(a),isAnimating:!1,computedStyle:null,tweensContainer:null,rootPropertyValueCache:{},transformCache:{}})},hook:null,mock:!1,version:{major:1,minor:2,patch:2},debug:!1};b.pageYOffset!==d?(t.State.scrollAnchor=b,t.State.scrollPropertyLeft="pageXOffset",t.State.scrollPropertyTop="pageYOffset"):(t.State.scrollAnchor=c.documentElement||c.body.parentNode||c.body,t.State.scrollPropertyLeft="scrollLeft",t.State.scrollPropertyTop="scrollTop");var u=function(){function a(a){return-a.tension*a.x-a.friction*a.v}function b(b,c,d){var e={x:b.x+d.dx*c,v:b.v+d.dv*c,tension:b.tension,friction:b.friction};return{dx:e.v,dv:a(e)}}function c(c,d){var e={dx:c.v,dv:a(c)},f=b(c,.5*d,e),g=b(c,.5*d,f),h=b(c,d,g),i=1/6*(e.dx+2*(f.dx+g.dx)+h.dx),j=1/6*(e.dv+2*(f.dv+g.dv)+h.dv);return c.x=c.x+i*d,c.v=c.v+j*d,c}return function d(a,b,e){var f,g,h,i={x:-1,v:0,tension:null,friction:null},j=[0],k=0,l=1e-4,m=.016;for(a=parseFloat(a)||500,b=parseFloat(b)||20,e=e||null,i.tension=a,i.friction=b,f=null!==e,f?(k=d(a,b),g=k/e*m):g=m;;)if(h=c(h||i,g),j.push(1+h.x),k+=16,!(Math.abs(h.x)>l&&Math.abs(h.v)>l))break;return f?function(a){return j[a*(j.length-1)|0]}:k}}();t.Easings={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2},spring:function(a){return 1-Math.cos(4.5*a*Math.PI)*Math.exp(6*-a)}},m.each([["ease",[.25,.1,.25,1]],["ease-in",[.42,0,1,1]],["ease-out",[0,0,.58,1]],["ease-in-out",[.42,0,.58,1]],["easeInSine",[.47,0,.745,.715]],["easeOutSine",[.39,.575,.565,1]],["easeInOutSine",[.445,.05,.55,.95]],["easeInQuad",[.55,.085,.68,.53]],["easeOutQuad",[.25,.46,.45,.94]],["easeInOutQuad",[.455,.03,.515,.955]],["easeInCubic",[.55,.055,.675,.19]],["easeOutCubic",[.215,.61,.355,1]],["easeInOutCubic",[.645,.045,.355,1]],["easeInQuart",[.895,.03,.685,.22]],["easeOutQuart",[.165,.84,.44,1]],["easeInOutQuart",[.77,0,.175,1]],["easeInQuint",[.755,.05,.855,.06]],["easeOutQuint",[.23,1,.32,1]],["easeInOutQuint",[.86,0,.07,1]],["easeInExpo",[.95,.05,.795,.035]],["easeOutExpo",[.19,1,.22,1]],["easeInOutExpo",[1,0,0,1]],["easeInCirc",[.6,.04,.98,.335]],["easeOutCirc",[.075,.82,.165,1]],["easeInOutCirc",[.785,.135,.15,.86]]],function(a,b){t.Easings[b[0]]=i.apply(null,b[1])});var v=t.CSS={RegEx:{isHex:/^#([A-f\d]{3}){1,2}$/i,valueUnwrap:/^[A-z]+\((.*)\)$/i,wrappedValueAlreadyExtracted:/[0-9.]+ [0-9.]+ [0-9.]+( [0-9.]+)?/,valueSplit:/([A-z]+\(.+\))|(([A-z0-9#-.]+?)(?=\s|$))/gi},Lists:{colors:["fill","stroke","stopColor","color","backgroundColor","borderColor","borderTopColor","borderRightColor","borderBottomColor","borderLeftColor","outlineColor"],transformsBase:["translateX","translateY","scale","scaleX","scaleY","skewX","skewY","rotateZ"],transforms3D:["transformPerspective","translateZ","scaleZ","rotateX","rotateY"]},Hooks:{templates:{textShadow:["Color X Y Blur","black 0px 0px 0px"],boxShadow:["Color X Y Blur Spread","black 0px 0px 0px 0px"],clip:["Top Right Bottom Left","0px 0px 0px 0px"],backgroundPosition:["X Y","0% 0%"],transformOrigin:["X Y Z","50% 50% 0px"],perspectiveOrigin:["X Y","50% 50%"]},registered:{},register:function(){for(var a=0;a<v.Lists.colors.length;a++){var b="color"===v.Lists.colors[a]?"0 0 0 1":"255 255 255 1";v.Hooks.templates[v.Lists.colors[a]]=["Red Green Blue Alpha",b]}var c,d,e;if(n)for(c in v.Hooks.templates){d=v.Hooks.templates[c],e=d[0].split(" ");var f=d[1].match(v.RegEx.valueSplit);"Color"===e[0]&&(e.push(e.shift()),f.push(f.shift()),v.Hooks.templates[c]=[e.join(" "),f.join(" ")])}for(c in v.Hooks.templates){d=v.Hooks.templates[c],e=d[0].split(" ");for(var a in e){var g=c+e[a],h=a;v.Hooks.registered[g]=[c,h]}}},getRoot:function(a){var b=v.Hooks.registered[a];return b?b[0]:a},cleanRootPropertyValue:function(a,b){return v.RegEx.valueUnwrap.test(b)&&(b=b.match(v.RegEx.valueUnwrap)[1]),v.Values.isCSSNullValue(b)&&(b=v.Hooks.templates[a][1]),b},extractValue:function(a,b){var c=v.Hooks.registered[a];if(c){var d=c[0],e=c[1];return b=v.Hooks.cleanRootPropertyValue(d,b),b.toString().match(v.RegEx.valueSplit)[e]}return b},injectValue:function(a,b,c){var d=v.Hooks.registered[a];if(d){var e,f,g=d[0],h=d[1];return c=v.Hooks.cleanRootPropertyValue(g,c),e=c.toString().match(v.RegEx.valueSplit),e[h]=b,f=e.join(" ")}return c}},Normalizations:{registered:{clip:function(a,b,c){switch(a){case"name":return"clip";case"extract":var d;return v.RegEx.wrappedValueAlreadyExtracted.test(c)?d=c:(d=c.toString().match(v.RegEx.valueUnwrap),d=d?d[1].replace(/,(\s+)?/g," "):c),d;case"inject":return"rect("+c+")"}},blur:function(a,b,c){switch(a){case"name":return t.State.isFirefox?"filter":"-webkit-filter";case"extract":var d=parseFloat(c);if(!d&&0!==d){var e=c.toString().match(/blur\(([0-9]+[A-z]+)\)/i);d=e?e[1]:0}return d;case"inject":return parseFloat(c)?"blur("+c+")":"none"}},opacity:function(a,b,c){if(8>=n)switch(a){case"name":return"filter";case"extract":var d=c.toString().match(/alpha\(opacity=(.*)\)/i);return c=d?d[1]/100:1;case"inject":return b.style.zoom=1,parseFloat(c)>=1?"":"alpha(opacity="+parseInt(100*parseFloat(c),10)+")"}else switch(a){case"name":return"opacity";case"extract":return c;case"inject":return c}}},register:function(){9>=n||t.State.isGingerbread||(v.Lists.transformsBase=v.Lists.transformsBase.concat(v.Lists.transforms3D));for(var a=0;a<v.Lists.transformsBase.length;a++)!function(){var b=v.Lists.transformsBase[a];v.Normalizations.registered[b]=function(a,c,e){switch(a){case"name":return"transform";case"extract":return g(c)===d||g(c).transformCache[b]===d?/^scale/i.test(b)?1:0:g(c).transformCache[b].replace(/[()]/g,"");case"inject":var f=!1;switch(b.substr(0,b.length-1)){case"translate":f=!/(%|px|em|rem|vw|vh|\d)$/i.test(e);break;case"scal":case"scale":t.State.isAndroid&&g(c).transformCache[b]===d&&1>e&&(e=1),f=!/(\d)$/i.test(e);break;case"skew":f=!/(deg|\d)$/i.test(e);break;case"rotate":f=!/(deg|\d)$/i.test(e)}return f||(g(c).transformCache[b]="("+e+")"),g(c).transformCache[b]}}}();for(var a=0;a<v.Lists.colors.length;a++)!function(){var b=v.Lists.colors[a];v.Normalizations.registered[b]=function(a,c,e){switch(a){case"name":return b;case"extract":var f;if(v.RegEx.wrappedValueAlreadyExtracted.test(e))f=e;else{var g,h={black:"rgb(0, 0, 0)",blue:"rgb(0, 0, 255)",gray:"rgb(128, 128, 128)",green:"rgb(0, 128, 0)",red:"rgb(255, 0, 0)",white:"rgb(255, 255, 255)"};/^[A-z]+$/i.test(e)?g=h[e]!==d?h[e]:h.black:v.RegEx.isHex.test(e)?g="rgb("+v.Values.hexToRgb(e).join(" ")+")":/^rgba?\(/i.test(e)||(g=h.black),f=(g||e).toString().match(v.RegEx.valueUnwrap)[1].replace(/,(\s+)?/g," ")}return 8>=n||3!==f.split(" ").length||(f+=" 1"),f;case"inject":return 8>=n?4===e.split(" ").length&&(e=e.split(/\s+/).slice(0,3).join(" ")):3===e.split(" ").length&&(e+=" 1"),(8>=n?"rgb":"rgba")+"("+e.replace(/\s+/g,",").replace(/\.(\d)+(?=,)/g,"")+")"}}}()}},Names:{camelCase:function(a){return a.replace(/-(\w)/g,function(a,b){return b.toUpperCase()})},SVGAttribute:function(a){var b="width|height|x|y|cx|cy|r|rx|ry|x1|x2|y1|y2";return(n||t.State.isAndroid&&!t.State.isChrome)&&(b+="|transform"),new RegExp("^("+b+")$","i").test(a)},prefixCheck:function(a){if(t.State.prefixMatches[a])return[t.State.prefixMatches[a],!0];for(var b=["","Webkit","Moz","ms","O"],c=0,d=b.length;d>c;c++){var e;if(e=0===c?a:b[c]+a.replace(/^\w/,function(a){return a.toUpperCase()}),p.isString(t.State.prefixElement.style[e]))return t.State.prefixMatches[a]=e,[e,!0]}return[a,!1]}},Values:{hexToRgb:function(a){var b,c=/^#?([a-f\d])([a-f\d])([a-f\d])$/i,d=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;return a=a.replace(c,function(a,b,c,d){return b+b+c+c+d+d}),b=d.exec(a),b?[parseInt(b[1],16),parseInt(b[2],16),parseInt(b[3],16)]:[0,0,0]},isCSSNullValue:function(a){return 0==a||/^(none|auto|transparent|(rgba\(0, ?0, ?0, ?0\)))$/i.test(a)},getUnitType:function(a){return/^(rotate|skew)/i.test(a)?"deg":/(^(scale|scaleX|scaleY|scaleZ|alpha|flexGrow|flexHeight|zIndex|fontWeight)$)|((opacity|red|green|blue|alpha)$)/i.test(a)?"":"px"},getDisplayType:function(a){var b=a&&a.tagName.toString().toLowerCase();return/^(b|big|i|small|tt|abbr|acronym|cite|code|dfn|em|kbd|strong|samp|var|a|bdo|br|img|map|object|q|script|span|sub|sup|button|input|label|select|textarea)$/i.test(b)?"inline":/^(li)$/i.test(b)?"list-item":/^(tr)$/i.test(b)?"table-row":/^(table)$/i.test(b)?"table":/^(tbody)$/i.test(b)?"table-row-group":"block"},addClass:function(a,b){a.classList?a.classList.add(b):a.className+=(a.className.length?" ":"")+b},removeClass:function(a,b){a.classList?a.classList.remove(b):a.className=a.className.toString().replace(new RegExp("(^|\\s)"+b.split(" ").join("|")+"(\\s|$)","gi")," ")}},getPropertyValue:function(a,c,e,f){function h(a,c){function e(){j&&v.setPropertyValue(a,"display","none")}var i=0;if(8>=n)i=m.css(a,c);else{var j=!1;if(/^(width|height)$/.test(c)&&0===v.getPropertyValue(a,"display")&&(j=!0,v.setPropertyValue(a,"display",v.Values.getDisplayType(a))),!f){if("height"===c&&"border-box"!==v.getPropertyValue(a,"boxSizing").toString().toLowerCase()){var k=a.offsetHeight-(parseFloat(v.getPropertyValue(a,"borderTopWidth"))||0)-(parseFloat(v.getPropertyValue(a,"borderBottomWidth"))||0)-(parseFloat(v.getPropertyValue(a,"paddingTop"))||0)-(parseFloat(v.getPropertyValue(a,"paddingBottom"))||0);return e(),k}if("width"===c&&"border-box"!==v.getPropertyValue(a,"boxSizing").toString().toLowerCase()){var l=a.offsetWidth-(parseFloat(v.getPropertyValue(a,"borderLeftWidth"))||0)-(parseFloat(v.getPropertyValue(a,"borderRightWidth"))||0)-(parseFloat(v.getPropertyValue(a,"paddingLeft"))||0)-(parseFloat(v.getPropertyValue(a,"paddingRight"))||0);return e(),l}}var o;o=g(a)===d?b.getComputedStyle(a,null):g(a).computedStyle?g(a).computedStyle:g(a).computedStyle=b.getComputedStyle(a,null),"borderColor"===c&&(c="borderTopColor"),i=9===n&&"filter"===c?o.getPropertyValue(c):o[c],(""===i||null===i)&&(i=a.style[c]),e()}if("auto"===i&&/^(top|right|bottom|left)$/i.test(c)){var p=h(a,"position");("fixed"===p||"absolute"===p&&/top|left/i.test(c))&&(i=m(a).position()[c]+"px")}return i}var i;if(v.Hooks.registered[c]){var j=c,k=v.Hooks.getRoot(j);e===d&&(e=v.getPropertyValue(a,v.Names.prefixCheck(k)[0])),v.Normalizations.registered[k]&&(e=v.Normalizations.registered[k]("extract",a,e)),i=v.Hooks.extractValue(j,e)}else if(v.Normalizations.registered[c]){var l,o;l=v.Normalizations.registered[c]("name",a),"transform"!==l&&(o=h(a,v.Names.prefixCheck(l)[0]),v.Values.isCSSNullValue(o)&&v.Hooks.templates[c]&&(o=v.Hooks.templates[c][1])),i=v.Normalizations.registered[c]("extract",a,o)}if(!/^[\d-]/.test(i))if(g(a)&&g(a).isSVG&&v.Names.SVGAttribute(c))if(/^(height|width)$/i.test(c))try{i=a.getBBox()[c]}catch(p){i=0}else i=a.getAttribute(c);else i=h(a,v.Names.prefixCheck(c)[0]);return v.Values.isCSSNullValue(i)&&(i=0),t.debug>=2&&console.log("Get "+c+": "+i),i},setPropertyValue:function(a,c,d,e,f){var h=c;if("scroll"===c)f.container?f.container["scroll"+f.direction]=d:"Left"===f.direction?b.scrollTo(d,f.alternateValue):b.scrollTo(f.alternateValue,d);else if(v.Normalizations.registered[c]&&"transform"===v.Normalizations.registered[c]("name",a))v.Normalizations.registered[c]("inject",a,d),h="transform",d=g(a).transformCache[c];else{if(v.Hooks.registered[c]){var i=c,j=v.Hooks.getRoot(c);e=e||v.getPropertyValue(a,j),d=v.Hooks.injectValue(i,d,e),c=j}if(v.Normalizations.registered[c]&&(d=v.Normalizations.registered[c]("inject",a,d),c=v.Normalizations.registered[c]("name",a)),h=v.Names.prefixCheck(c)[0],8>=n)try{a.style[h]=d}catch(k){t.debug&&console.log("Browser does not support ["+d+"] for ["+h+"]")}else g(a)&&g(a).isSVG&&v.Names.SVGAttribute(c)?a.setAttribute(c,d):a.style[h]=d;t.debug>=2&&console.log("Set "+c+" ("+h+"): "+d)}return[h,d]},flushTransformCache:function(a){function b(b){return parseFloat(v.getPropertyValue(a,b))}var c="";if((n||t.State.isAndroid&&!t.State.isChrome)&&g(a).isSVG){var d={translate:[b("translateX"),b("translateY")],skewX:[b("skewX")],skewY:[b("skewY")],scale:1!==b("scale")?[b("scale"),b("scale")]:[b("scaleX"),b("scaleY")],rotate:[b("rotateZ"),0,0]};m.each(g(a).transformCache,function(a){/^translate/i.test(a)?a="translate":/^scale/i.test(a)?a="scale":/^rotate/i.test(a)&&(a="rotate"),d[a]&&(c+=a+"("+d[a].join(" ")+") ",delete d[a])})}else{var e,f;m.each(g(a).transformCache,function(b){return e=g(a).transformCache[b],"transformPerspective"===b?(f=e,!0):(9===n&&"rotateZ"===b&&(b="rotate"),void(c+=b+e+" "))}),f&&(c="perspective"+f+" "+c)}v.setPropertyValue(a,"transform",c)}};v.Hooks.register(),v.Normalizations.register(),t.hook=function(a,b,c){var e=d;return a=f(a),m.each(a,function(a,f){if(g(f)===d&&t.init(f),c===d)e===d&&(e=t.CSS.getPropertyValue(f,b));else{var h=t.CSS.setPropertyValue(f,b,c);"transform"===h[0]&&t.CSS.flushTransformCache(f),e=h}}),e};var w=function(){function a(){return h?B.promise||null:i}function e(){function a(){function a(a,b){var c=d,e=d,g=d;return p.isArray(a)?(c=a[0],!p.isArray(a[1])&&/^[\d-]/.test(a[1])||p.isFunction(a[1])||v.RegEx.isHex.test(a[1])?g=a[1]:(p.isString(a[1])&&!v.RegEx.isHex.test(a[1])||p.isArray(a[1]))&&(e=b?a[1]:j(a[1],h.duration),a[2]!==d&&(g=a[2]))):c=a,b||(e=e||h.easing),p.isFunction(c)&&(c=c.call(f,y,x)),p.isFunction(g)&&(g=g.call(f,y,x)),[c||0,e,g]}function l(a,b){var c,d;return d=(b||"0").toString().toLowerCase().replace(/[%A-z]+$/,function(a){return c=a,""}),c||(c=v.Values.getUnitType(a)),[d,c]}function n(){var a={myParent:f.parentNode||c.body,position:v.getPropertyValue(f,"position"),fontSize:v.getPropertyValue(f,"fontSize")},d=a.position===I.lastPosition&&a.myParent===I.lastParent,e=a.fontSize===I.lastFontSize;I.lastParent=a.myParent,I.lastPosition=a.position,I.lastFontSize=a.fontSize;var h=100,i={};if(e&&d)i.emToPx=I.lastEmToPx,i.percentToPxWidth=I.lastPercentToPxWidth,i.percentToPxHeight=I.lastPercentToPxHeight;else{var j=g(f).isSVG?c.createElementNS("http://www.w3.org/2000/svg","rect"):c.createElement("div");t.init(j),a.myParent.appendChild(j),m.each(["overflow","overflowX","overflowY"],function(a,b){t.CSS.setPropertyValue(j,b,"hidden")}),t.CSS.setPropertyValue(j,"position",a.position),t.CSS.setPropertyValue(j,"fontSize",a.fontSize),t.CSS.setPropertyValue(j,"boxSizing","content-box"),m.each(["minWidth","maxWidth","width","minHeight","maxHeight","height"],function(a,b){t.CSS.setPropertyValue(j,b,h+"%")}),t.CSS.setPropertyValue(j,"paddingLeft",h+"em"),i.percentToPxWidth=I.lastPercentToPxWidth=(parseFloat(v.getPropertyValue(j,"width",null,!0))||1)/h,i.percentToPxHeight=I.lastPercentToPxHeight=(parseFloat(v.getPropertyValue(j,"height",null,!0))||1)/h,i.emToPx=I.lastEmToPx=(parseFloat(v.getPropertyValue(j,"paddingLeft"))||1)/h,a.myParent.removeChild(j)}return null===I.remToPx&&(I.remToPx=parseFloat(v.getPropertyValue(c.body,"fontSize"))||16),null===I.vwToPx&&(I.vwToPx=parseFloat(b.innerWidth)/100,I.vhToPx=parseFloat(b.innerHeight)/100),i.remToPx=I.remToPx,i.vwToPx=I.vwToPx,i.vhToPx=I.vhToPx,t.debug>=1&&console.log("Unit ratios: "+JSON.stringify(i),f),i}if(h.begin&&0===y)try{h.begin.call(o,o)}catch(r){setTimeout(function(){throw r},1)}if("scroll"===C){var u,w,z,A=/^x$/i.test(h.axis)?"Left":"Top",D=parseFloat(h.offset)||0;h.container?p.isWrapped(h.container)||p.isNode(h.container)?(h.container=h.container[0]||h.container,u=h.container["scroll"+A],z=u+m(f).position()[A.toLowerCase()]+D):h.container=null:(u=t.State.scrollAnchor[t.State["scrollProperty"+A]],w=t.State.scrollAnchor[t.State["scrollProperty"+("Left"===A?"Top":"Left")]],z=m(f).offset()[A.toLowerCase()]+D),i={scroll:{rootPropertyValue:!1,startValue:u,currentValue:u,endValue:z,unitType:"",easing:h.easing,scrollData:{container:h.container,direction:A,alternateValue:w}},element:f},t.debug&&console.log("tweensContainer (scroll): ",i.scroll,f)}else if("reverse"===C){if(!g(f).tweensContainer)return void m.dequeue(f,h.queue);"none"===g(f).opts.display&&(g(f).opts.display="auto"),"hidden"===g(f).opts.visibility&&(g(f).opts.visibility="visible"),g(f).opts.loop=!1,g(f).opts.begin=null,g(f).opts.complete=null,s.easing||delete h.easing,s.duration||delete h.duration,h=m.extend({},g(f).opts,h);var E=m.extend(!0,{},g(f).tweensContainer);for(var F in E)if("element"!==F){var G=E[F].startValue;E[F].startValue=E[F].currentValue=E[F].endValue,E[F].endValue=G,p.isEmptyObject(s)||(E[F].easing=h.easing),t.debug&&console.log("reverse tweensContainer ("+F+"): "+JSON.stringify(E[F]),f)}i=E}else if("start"===C){var E;g(f).tweensContainer&&g(f).isAnimating===!0&&(E=g(f).tweensContainer),m.each(q,function(b,c){if(RegExp("^"+v.Lists.colors.join("$|^")+"$").test(b)){var e=a(c,!0),f=e[0],g=e[1],h=e[2];if(v.RegEx.isHex.test(f)){for(var i=["Red","Green","Blue"],j=v.Values.hexToRgb(f),k=h?v.Values.hexToRgb(h):d,l=0;l<i.length;l++){var m=[j[l]];g&&m.push(g),k!==d&&m.push(k[l]),q[b+i[l]]=m}delete q[b]}}});for(var H in q){var K=a(q[H]),L=K[0],M=K[1],N=K[2];H=v.Names.camelCase(H);var O=v.Hooks.getRoot(H),P=!1;if(g(f).isSVG||"tween"===O||v.Names.prefixCheck(O)[1]!==!1||v.Normalizations.registered[O]!==d){(h.display!==d&&null!==h.display&&"none"!==h.display||h.visibility!==d&&"hidden"!==h.visibility)&&/opacity|filter/.test(H)&&!N&&0!==L&&(N=0),h._cacheValues&&E&&E[H]?(N===d&&(N=E[H].endValue+E[H].unitType),P=g(f).rootPropertyValueCache[O]):v.Hooks.registered[H]?N===d?(P=v.getPropertyValue(f,O),N=v.getPropertyValue(f,H,P)):P=v.Hooks.templates[O][1]:N===d&&(N=v.getPropertyValue(f,H));var Q,R,S,T=!1;if(Q=l(H,N),N=Q[0],S=Q[1],Q=l(H,L),L=Q[0].replace(/^([+-\/*])=/,function(a,b){return T=b,""}),R=Q[1],N=parseFloat(N)||0,L=parseFloat(L)||0,"%"===R&&(/^(fontSize|lineHeight)$/.test(H)?(L/=100,R="em"):/^scale/.test(H)?(L/=100,R=""):/(Red|Green|Blue)$/i.test(H)&&(L=L/100*255,R="")),/[\/*]/.test(T))R=S;else if(S!==R&&0!==N)if(0===L)R=S;else{e=e||n();var U=/margin|padding|left|right|width|text|word|letter/i.test(H)||/X$/.test(H)||"x"===H?"x":"y";switch(S){case"%":N*="x"===U?e.percentToPxWidth:e.percentToPxHeight;break;case"px":break;default:N*=e[S+"ToPx"]}switch(R){case"%":N*=1/("x"===U?e.percentToPxWidth:e.percentToPxHeight);break;case"px":break;default:N*=1/e[R+"ToPx"]}}switch(T){case"+":L=N+L;break;case"-":L=N-L;break;case"*":L=N*L;break;case"/":L=N/L}i[H]={rootPropertyValue:P,startValue:N,currentValue:N,endValue:L,unitType:R,easing:M},t.debug&&console.log("tweensContainer ("+H+"): "+JSON.stringify(i[H]),f)}else t.debug&&console.log("Skipping ["+O+"] due to a lack of browser support.")}i.element=f}i.element&&(v.Values.addClass(f,"velocity-animating"),J.push(i),""===h.queue&&(g(f).tweensContainer=i,g(f).opts=h),g(f).isAnimating=!0,y===x-1?(t.State.calls.push([J,o,h,null,B.resolver]),t.State.isTicking===!1&&(t.State.isTicking=!0,k())):y++)}var e,f=this,h=m.extend({},t.defaults,s),i={};switch(g(f)===d&&t.init(f),parseFloat(h.delay)&&h.queue!==!1&&m.queue(f,h.queue,function(a){t.velocityQueueEntryFlag=!0,g(f).delayTimer={setTimeout:setTimeout(a,parseFloat(h.delay)),next:a}}),h.duration.toString().toLowerCase()){case"fast":h.duration=200;break;case"normal":h.duration=r;break;case"slow":h.duration=600;break;default:h.duration=parseFloat(h.duration)||1}t.mock!==!1&&(t.mock===!0?h.duration=h.delay=1:(h.duration*=parseFloat(t.mock)||1,h.delay*=parseFloat(t.mock)||1)),h.easing=j(h.easing,h.duration),h.begin&&!p.isFunction(h.begin)&&(h.begin=null),h.progress&&!p.isFunction(h.progress)&&(h.progress=null),h.complete&&!p.isFunction(h.complete)&&(h.complete=null),h.display!==d&&null!==h.display&&(h.display=h.display.toString().toLowerCase(),"auto"===h.display&&(h.display=t.CSS.Values.getDisplayType(f))),h.visibility!==d&&null!==h.visibility&&(h.visibility=h.visibility.toString().toLowerCase()),h.mobileHA=h.mobileHA&&t.State.isMobile&&!t.State.isGingerbread,h.queue===!1?h.delay?setTimeout(a,h.delay):a():m.queue(f,h.queue,function(b,c){return c===!0?(B.promise&&B.resolver(o),!0):(t.velocityQueueEntryFlag=!0,void a(b))}),""!==h.queue&&"fx"!==h.queue||"inprogress"===m.queue(f)[0]||m.dequeue(f)}var h,i,n,o,q,s,u=arguments[0]&&(arguments[0].p||m.isPlainObject(arguments[0].properties)&&!arguments[0].properties.names||p.isString(arguments[0].properties));if(p.isWrapped(this)?(h=!1,n=0,o=this,i=this):(h=!0,n=1,o=u?arguments[0].elements||arguments[0].e:arguments[0]),o=f(o)){u?(q=arguments[0].properties||arguments[0].p,s=arguments[0].options||arguments[0].o):(q=arguments[n],s=arguments[n+1]);var x=o.length,y=0;if(!/^(stop|finish|finishAll)$/i.test(q)&&!m.isPlainObject(s)){var z=n+1;s={};for(var A=z;A<arguments.length;A++)p.isArray(arguments[A])||!/^(fast|normal|slow)$/i.test(arguments[A])&&!/^\d/.test(arguments[A])?p.isString(arguments[A])||p.isArray(arguments[A])?s.easing=arguments[A]:p.isFunction(arguments[A])&&(s.complete=arguments[A]):s.duration=arguments[A]}var B={promise:null,resolver:null,rejecter:null};h&&t.Promise&&(B.promise=new t.Promise(function(a,b){B.resolver=a,B.rejecter=b}));var C;switch(q){case"scroll":C="scroll";break;case"reverse":C="reverse";break;case"finish":case"finishAll":case"stop":m.each(o,function(a,b){g(b)&&g(b).delayTimer&&(clearTimeout(g(b).delayTimer.setTimeout),g(b).delayTimer.next&&g(b).delayTimer.next(),delete g(b).delayTimer),"finishAll"!==q||s!==!0&&!p.isString(s)||(m.each(m.queue(b,p.isString(s)?s:""),function(a,b){p.isFunction(b)&&b()}),m.queue(b,p.isString(s)?s:"",[]))});var D=[];return m.each(t.State.calls,function(a,b){b&&m.each(b[1],function(c,e){var f=s===d?"":s;return f===!0||b[2].queue===f||s===d&&b[2].queue===!1?void m.each(o,function(c,d){d===e&&((s===!0||p.isString(s))&&(m.each(m.queue(d,p.isString(s)?s:""),function(a,b){p.isFunction(b)&&b(null,!0)
}),m.queue(d,p.isString(s)?s:"",[])),"stop"===q?(g(d)&&g(d).tweensContainer&&f!==!1&&m.each(g(d).tweensContainer,function(a,b){b.endValue=b.currentValue}),D.push(a)):("finish"===q||"finishAll"===q)&&(b[2].duration=1))}):!0})}),"stop"===q&&(m.each(D,function(a,b){l(b,!0)}),B.promise&&B.resolver(o)),a();default:if(!m.isPlainObject(q)||p.isEmptyObject(q)){if(p.isString(q)&&t.Redirects[q]){var E=m.extend({},s),F=E.duration,G=E.delay||0;return E.backwards===!0&&(o=m.extend(!0,[],o).reverse()),m.each(o,function(a,b){parseFloat(E.stagger)?E.delay=G+parseFloat(E.stagger)*a:p.isFunction(E.stagger)&&(E.delay=G+E.stagger.call(b,a,x)),E.drag&&(E.duration=parseFloat(F)||(/^(callout|transition)/.test(q)?1e3:r),E.duration=Math.max(E.duration*(E.backwards?1-a/x:(a+1)/x),.75*E.duration,200)),t.Redirects[q].call(b,b,E||{},a,x,o,B.promise?B:d)}),a()}var H="Velocity: First argument ("+q+") was not a property map, a known action, or a registered redirect. Aborting.";return B.promise?B.rejecter(new Error(H)):console.log(H),a()}C="start"}var I={lastParent:null,lastPosition:null,lastFontSize:null,lastPercentToPxWidth:null,lastPercentToPxHeight:null,lastEmToPx:null,remToPx:null,vwToPx:null,vhToPx:null},J=[];m.each(o,function(a,b){p.isNode(b)&&e.call(b)});var K,E=m.extend({},t.defaults,s);if(E.loop=parseInt(E.loop),K=2*E.loop-1,E.loop)for(var L=0;K>L;L++){var M={delay:E.delay,progress:E.progress};L===K-1&&(M.display=E.display,M.visibility=E.visibility,M.complete=E.complete),w(o,"reverse",M)}return a()}};t=m.extend(w,t),t.animate=w;var x=b.requestAnimationFrame||o;return t.State.isMobile||c.hidden===d||c.addEventListener("visibilitychange",function(){c.hidden?(x=function(a){return setTimeout(function(){a(!0)},16)},k()):x=b.requestAnimationFrame||o}),a.Velocity=t,a!==b&&(a.fn.velocity=w,a.fn.velocity.defaults=t.defaults),m.each(["Down","Up"],function(a,b){t.Redirects["slide"+b]=function(a,c,e,f,g,h){var i=m.extend({},c),j=i.begin,k=i.complete,l={height:"",marginTop:"",marginBottom:"",paddingTop:"",paddingBottom:""},n={};i.display===d&&(i.display="Down"===b?"inline"===t.CSS.Values.getDisplayType(a)?"inline-block":"block":"none"),i.begin=function(){j&&j.call(g,g);for(var c in l){n[c]=a.style[c];var d=t.CSS.getPropertyValue(a,c);l[c]="Down"===b?[d,0]:[0,d]}n.overflow=a.style.overflow,a.style.overflow="hidden"},i.complete=function(){for(var b in n)a.style[b]=n[b];k&&k.call(g,g),h&&h.resolver(g)},t(a,l,i)}}),m.each(["In","Out"],function(a,b){t.Redirects["fade"+b]=function(a,c,e,f,g,h){var i=m.extend({},c),j={opacity:"In"===b?1:0},k=i.complete;i.complete=e!==f-1?i.begin=null:function(){k&&k.call(g,g),h&&h.resolver(g)},i.display===d&&(i.display="In"===b?"auto":"none"),t(this,j,i)}}),t}(window.jQuery||window.Zepto||window,window,document)});