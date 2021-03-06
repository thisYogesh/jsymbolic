# jSymbolic
jSymbolic javaScript Library :)  *Beta*

Hi all, 
  > jSymbolic comes with a new way to manipulate your DOM.
  > The main intention behind this library creation is just my fun!....
    hope you will also enjoy this symbolic driven jSymbolic-javaScript Library

  > So lets take a look at jSymbolic
  
  
## jSymbolic Overview

  > As the name suggested **jSymbolic** it comes with some 
  > intresting symbols insted of function name are as like below.
  ```
  Document Load Event       :)
  Next Sibling              >
  Previous Sibling          <
  Parent Element            ^
  Find in DOM               ?
  Remove Element            x     and so on many symbols....
  ```
## How To Use symbols?

  > Here we go!
  ```
  :)      $S(document, ':)', function(){}); // :) DOM Loaded!
  >       $S('selector', '>') // this will return next element.
  <       $S('selector', '<') // this will return previous element.
  ^       $S('selector', '^') // this will return parent of element.
  ?       $S('selector', '?{span}') // this will find span element in given selector.
  x       $S('selector', 'x') // this will remove element.
  ```
  > Hope you enjoying the symbols.  ;-),  lets use these all symbols together
  
## Chaining in jSymbolic
  
  > like in javascript we can call chainable function with dot(.) seperated like..
    // fun().fun1().func2() .... 
  > Here we can also use symbols like that
  ```
  $S(document,':)',function(){
      $S('selector','>.<.^.?{span}.x') 
  });
  after loading document from main selector jSymbolic goto next element then preveious element
  then goto parant element then find span within it and finally remove all span elements.
  ```
  we can also write as below 
  ```
  $S('selector','>')._('<.^')._('?{span}')._('x');
  ```
## How to save object in variable and use them

```
  var obj = $S('selector'); // you are saving jSymbolic Object into obj variable
  var val = obj._('%') // here you can apply symbols on saved object like this
```

## Event Handeling
  >
  **Event Binding** (*+=*)
```
  $S('selector','+={click}',function(){
      alert('click fired!');
  });
```

**Event Unbinding** (*-=*)
```
  $S('selector','-={click}');
```
  
## HTML5 Dataset (*#*)
  >
```
  $S('selector','#{id=E0}') // setting id in dataset
  var id = $S('selector','#{id}') // getting id from dataset
```  
## Attribute Manipulation (*@*)
  >
```
  $S('selector','@{name=city}') // setting name attribute to element
  $S('selector','@{name=city,id=city01}') // setting multiple attribute to element
  $S('selector','@{name}') // getting name attribute of element
  $S('selector','@{name,id}') // getting multiple attribute of element
```
## CSS Manipulation (*&*)
  >
```
  $S('selector','&{float:left}') // setting float style property to element
  $S('selector','&{float:left;display:block}') // setting multiple style property to element
  $S('selector','&{margin-left}') // getting margin left style property of element
  $S('selector','&{float;display}') // getting multiple style property of element
```
## Create Plugins (*=>*)
  > you can also define a new symbols
```
  $S('=>','Enter here your symbol', callback)
  lets create one symbol
  $S('=>',';->', function(){
      $S(this,'+={click}',function(){
          alert(';->');
      });
  });
  
  use this symbol on selector as below
  $S('selector',';->') // now when you click on element you will get an alert;
 
  Here I want to give you one more loveable example
  In this exmple I will append 'I Love jSymbolic' text in given selector
  $S('=>','♥',function(){
      $S(this,'>+{I Love jSymbolic}'); // here '>+' symbol is used for to append functionality
  });
  $S('selector','♥') // after you execute this, you will get to see appended text in your targeted selector
```

## AJAX (*>X<*)
  >
```
  S('>X<',{
      type : 'GET',
      url : 'https://www.googleapis.com/books/v1/volumes?fields=items&q=javascript',
      success : function(resp){
          console.log(resp)
      }
  });
```

## How jSymbolic return result
  >
```
  $S('selector','%') // here % sign used to get value from input field, lets see how it will return the result
  :: if selector return single element then
  $S('selector','%') // it will directly return value what is there in input field, as what we expect
  :: if we want to return multiple attributes of one element then
  $S('selector','@{name,id}') // result will be in JSON format like {name:'state',id:'SD12'}
  :: but what if selector return collection of element then
  $S('selector','@{name,id}') /* result will be in Array of JSON like 
                                *  [{
                                *      el: input, 
                                *      return: {name:'state1',id:'SD11'}
                                *  },{
                                *      el: input, 
                                *      return: {name:'state2',id:'SD12'}
                                *  }] 
                                */
```
