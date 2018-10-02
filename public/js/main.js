var errorEl = document.getElementById('errorMsg');
var customErrorEl = document.getElementById('customErrMsg');
var loaderEl =  document.getElementById('loader');
var sourceCodeContainerEl =  document.getElementById('source-code-container');
var searchContainerEl =  document.getElementById('search-container');
var markupMapperEl = document.getElementById('marker-mapper');
var pattern = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
var markupCountMapper = {};

var elementSelectorMapper = {
  errorEl: errorEl,
  customErrorEl: customErrorEl,
  loaderEl: loaderEl,
  sourceCodeContainerEl: sourceCodeContainerEl,
  searchContainerEl: searchContainerEl,
  markupMapperEl: markupMapperEl
};

function showElement(key) {
  if (!key) return;
  var selector = elementSelectorMapper[key];
  if(!selector) return;
  selector.className = selector.className.replace('hide', '');
}

function hideElement(key) {
  if (!key) return;
  var selector = elementSelectorMapper[key];
  if(!selector) return;
  if (selector.className.indexOf('hide') > -1) return;
  selector.className += ' hide';
}

function animateCustomErrorMsg() {
  showElement('customErrorEl');
  window.setTimeout(function () {
    hideElement('customErrorEl');
  }, 3000);
}

function ajax(url, data, callback) {
  try {
    var x = new(this.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
    x.open(data ? 'POST' : 'GET', url, 1);
    x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    x.onreadystatechange = function () {
      x.readyState > 3 && callback && callback(x);
    };
    x.send(data);
  } catch (e) {
    window.console && console.log(e);
    callback(e);
  }
}

function removeAllMarkupHighlights() {
  var elements = document.querySelectorAll('[highlighter]');
  for(var i=0;i<elements.length;i++) {
    var selector = elements[i];
    selector.className = selector.className.replace('highlight', '');
  }
}

function highlightTag(evnt, key) {
  evnt.stopPropagation();
  removeAllMarkupHighlights();
  var hiddenChildEls = document.querySelectorAll('.hide-child-element');
  for(var i=0;i<hiddenChildEls.length;i++) {
    hiddenChildEls[i].className = hiddenChildEls[i].className.replace(/(hide-child-element)/g, '');
    var closedElements = hiddenChildEls[i].getElementsByClassName('glyphicon-triangle-right');
    for(var j=0;j<closedElements.length;j++) {
      closedElements[j].className = closedElements[j].className.replace(/(glyphicon-triangle-right)/g, 'glyphicon-triangle-bottom');
    }
  }
  var elements = document.querySelectorAll('[highlighter='+key+']');
  elements[0].scrollIntoView();
  window.scrollBy(0, -60);
  for(var i=0;i<elements.length;i++) {
    var selector = elements[i];
    if (selector.className.indexOf('highlight') === -1) {
      selector.className += ' highlight';
    }
  }
}

function setMarkupMapperHTML() {
  var arr = Object.keys(markupCountMapper);
  var html = '<table><tr><th>Tag</th><th>Count</th>';

  for(var i=0;i<arr.length; i++){
    html += '<tr><td><button onclick="highlightTag(event, \''+arr[i]+'\')">'+arr[i]+'</button></td><td>'+markupCountMapper[arr[i]]+'</td></tr>'
  };
  html += '</table>';
  document.getElementById('marker-mapper').innerHTML = html;
}

function handleAjaxResponse(resp) {
  hideElement('loaderEl');
  if(!resp || resp.statusText !== 'OK') {
    animateCustomErrorMsg();
    return;
  } else if (resp && resp.responseText) {
    try {
      var respData = JSON.parse(resp.response);
      if (respData.data) {
        var parser = new DOMParser();
        var htmlDoc = parser.parseFromString(respData.data, "text/html");
        markupCountMapper = {};
        var htmlText = createHTMLText(htmlDoc);
        setMarkupMapperHTML();
        hideElement('searchContainerEl');
        showElement('sourceCodeContainerEl');
        document.getElementById('source-code').innerHTML = htmlText;
        var searchVal = document.getElementById('search-text').value;
        document.getElementById('source-code-header').innerHTML = 'Source Code of '+searchVal;
      } else if(respData.error) {
        animateCustomErrorMsg();
      }
    } catch(e) {
      window.console && console.log(e);
      animateCustomErrorMsg();
    }
  }
}

function handleGotoSearchPageBtn() {
  hideElement('sourceCodeContainerEl');
  document.getElementById('search-text').value = '';
  showElement('searchContainerEl');
  hideElement('markupMapperEl');
}

function getSearchContent() {
  var el = document.getElementById('search-text');
  var value = el.value;

  if(!isURL(value)) {
    showElement('errorEl');
    return;
  }
  showElement('loaderEl');
  ajax('/get-html?url='+value, null, handleAjaxResponse);
}

function isURL(str) {
  return pattern.test(str);
}

function getTextNode(a, b) {
  return a + (b.nodeType === 3 ? b.textContent : '');
}

function getNodeAttributes(node) {
  return [].map.call(node.attributes, (attr => '<span class="attr">'+attr.nodeName +'<span class="attrSep">="<span class="attrVal">' + attr.nodeValue + '</span>"</span>')).join(' ');
}

function toggleMarkup(el) {
  if(el.className.indexOf('glyphicon-triangle-bottom') > -1) {
    el.className = el.className.replace(/(glyphicon-triangle-bottom)/g, 'glyphicon-triangle-right');
    el.parentElement.className += 'hide-child-element';
  } else if(el.className.indexOf('glyphicon-triangle-right') > -1) {
    el.className = el.className.replace(/(glyphicon-triangle-right)/g, 'glyphicon-triangle-bottom');
    el.parentElement.className = el.parentElement.className.replace(/(hide-child-element)/g, '');
  }
}

function createHTMLText(node){
  if(node.children.length === 0) {
    return '';
  }

  var arr = [];

  for (let i=0; i < node.children.length; i++) {
    var childNode = node.children[i];
    var textNode = [].reduce.call(childNode.childNodes, getTextNode, '');
    var tagName = childNode.localName;

    if (markupCountMapper[tagName]) {
      markupCountMapper[tagName] = (markupCountMapper[tagName] - 0) + 1;
    } else {
      markupCountMapper[tagName] = 1;
    }

    var markup = [
                    '<ul><li><button class="glyphicon glyphicon-triangle-bottom arrow" onclick="toggleMarkup(this)"></button><span class="brace"><</span><span class="tagname">',
                    '<span highlighter='+tagName+'>'+tagName+'</span>',
                    '&nbsp;',
                    getNodeAttributes(childNode),
                    '<span class="brace">></span>',
                    (textNode ? '<br/>' : ''),
                    (textNode ? ['<span class="textNode">', textNode, "<br/></span>"].join('') : ''),
                    createHTMLText(childNode),
                    '</span><span class="brace"><&#47;</span><span class="tagname">',
                    tagName,
                    '</span><span class="brace">\></span></li></ul>'
                  ].join('');

    arr.push(markup);
  }

  return arr.join('');
}
