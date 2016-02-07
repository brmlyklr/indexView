function $(t){return document.getElementById(t)}function DateField(t,e){this.elem=t,this.delegate=e,this.initDom()}function StatView(t,e){this.domParent=t,this.stat=e,this.initDom()}function overlaySets(t){var e=[{name:"None"}],a=dataSets.filter(function(e){return e.goodOverlay&&e.name!=t.name&&(e.group!=t.group||null==e.group)});return e.concat(a)}function reinvestDividends(t){for(var e=[1],a=t.price,i=t.dividend,n=1;n<a.length;n++){var r=a[n]/a[n-1];r+=i[n]/12/a[n],r*=e[n-1],e[n]=r}return e}function loadDataFile(t){if(dataFileCache[t])return dataFileCache[t];if(xmlhttp=new XMLHttpRequest,xmlhttp.open("GET","datasets/"+t,!1),xmlhttp.send(),200==xmlhttp.status){var e=JSON.parse(xmlhttp.responseText);return dataFileCache[t]=e,e}return alert("Failed to get "+t),null}function getDataSetStruct(t){var e=loadDataFile(t.file);return{vals:t.datFunc(e),firstYear:t.startYear(e),stats:t.stats,traceShowValue:t.traceShowValue,pointJump:t.pointJump||1}}function loadSetChooser(t,e){t.innerHTML="";for(var a=0;a<e.length;a++){var i=document.createElement("option");i.value=e[a].name,i.text=e[a].name,t.add(i,null)}}function setChooserChanged(){var t=$("dataset-chooser");t.blur(),loadData(t.selectedIndex)}function overlayChanged(){var t=$("overlay-chooser");if("None"==t.value)return void Viewer.clearOverlay();t.blur();for(var e=dataSets.length-1;e>=0;e--)if(dataSets[e].name==t.value)return void loadOverlay(e)}function loadData(t){var e=dataSets[t],a=getDataSetStruct(e);$("dataset-notes").innerHTML=e.notes,Viewer.loadData(a),loadSetChooser($("overlay-chooser"),overlaySets(e))}function loadOverlay(t){var e=dataSets[t],a=getDataSetStruct(e);Viewer.loadOverlay(a)}function sizeCanvas(){var t=$("container").clientWidth,e=$("graph"),a=795>t?170:205;e.width=t-a,e.height=Math.max(.4*e.width,320),Viewer.loadSize()}function load(){Viewer.loadCanvas(),sizeCanvas(),loadSetChooser($("dataset-chooser"),dataSets),loadSetChooser($("overlay-chooser"),dataSets),loadData(0)}Number.prototype.formatMoney=function(t,e,a){var i=this,t=isNaN(t=Math.abs(t))?2:t,e=void 0==e?".":e,a=void 0==a?",":a,n=0>i?"-":"",r=parseInt(i=Math.abs(+i||0).toFixed(t))+"",s=(s=r.length)>3?s%3:0;return n+(s?r.substr(0,s)+a:"")+r.substr(s).replace(/(\d{3})(?=\d)/g,"$1"+a)+(t?e+Math.abs(i-r).toFixed(t).slice(2):"")},DateField.prototype={initDom:function(){this.elem.className="date-entry",this.yearField=document.createElement("input"),this.yearField.type="text",this.yearField.className="time-field",this.yearField.onchange=this.yearChanged.bind(this),this.elem.appendChild(this.yearField);var t=document.createElement("span");t.className="date-months";var e="JFMAMJJASOND";this.monthSelectors=[];for(var a=0;a<e.length;a++){var i=document.createElement("a");i.href="#",i.appendChild(document.createTextNode(e[a]));var n=this.monthChanged.bind(this);i.onclick=n,this.monthSelectors[a]=i,t.appendChild(i)}this.elem.appendChild(t)},setDateFrom:function(t,e){var a=e+Math.floor(t/12),t=t%12;this.setDate(a,t)},setDate:function(t,e){this.curMonth=e,this.yearField.value=t;for(var a=0;a<this.monthSelectors.length;a++){var i=a==e?"cur-month":"";this.monthSelectors[a].className=i}},monthChanged:function(t){for(var e=0,a=0;a<this.monthSelectors.length;a++)t.currentTarget==this.monthSelectors[a]&&(e=a);this.curMonth=e,this.delegate.fieldChanged()},yearChanged:function(){this.delegate.fieldChanged()},getMonthInRange:function(t,e){var a=this.yearField.value;if(4!=a.length||isNaN(a))return null;if(a=parseInt(a),t>a)return null;var i=12*(a-t)+this.curMonth;return i>e?null:i}},StatView.prototype={initDom:function(){var t=this.stat.name,e=document.createElement("strong");this.titleText=document.createTextNode(t),e.appendChild(this.titleText);var a=document.createElement("div");if(this.valueText=document.createTextNode(""),a.appendChild(this.valueText),a.className="num",this.stat.description){var i=document.createElement("span");i.className="qs",i.appendChild(document.createTextNode("?"));var n=document.createElement("span");n.className="popover",n.appendChild(document.createTextNode(this.stat.description)),i.appendChild(n)}var r=document.createElement("div");i&&r.appendChild(i),r.appendChild(e),r.appendChild(document.createElement("br")),r.appendChild(a),r.appendChild(document.createElement("br")),this.container=r,this.domParent.appendChild(r)},update:function(t,e,a){var i=this.stat.calc(t,e,a);this.valueText.nodeValue=i}};var Viewer={loadCanvas:function(){if(this.canvas=$("graph"),this.canvas.getContext){this.ctx=this.canvas.getContext("2d");var t=this.zoom.bind(this),e=/Firefox/i.test(navigator.userAgent)?"DOMMouseScroll":"mousewheel";this.canvas.addEventListener(e,function(e){return t(e),e.preventDefault(),!1},!1);var a=this.mouse.bind(this);this.canvas.addEventListener("mousemove",function(t){a(t)},!1);var i=this;this.mouseDown=!1,this.canvas.addEventListener("mousedown",function(){i.mouseDown=!0},!1),this.canvas.addEventListener("mouseup",function(){i.mouseDown=!1},!1)}this.bigGraph={top:20,bottom:240,lineWidth:4,lineTop:0,decadeLabels:!0,yearLines:!0},this.scrubGraph={top:270,bottom:300,lineWidth:2,windowColor:"rgba(100,100,100,0.2)",lineTop:290,decadeLabels:!1,yearLines:!1},this.curTimeMode=0,this.loadDateFields(),this.loadTimeChooser(),this.startMonth=1200,this.endMonth=1/0,this.data=[],this.loadSize()},loadSize:function(){this.width=this.canvas.width,this.height=this.canvas.height,this.bigGraph.width=this.width,this.bigGraph.bottom=this.height-70,this.scrubGraph.width=this.width,this.scrubGraph.top=this.height-40,this.scrubGraph.bottom=this.height,this.draw()},loadDateFields:function(){this.dateFields=[];for(var t=0;3>=t;t++){var e=$("date-field-"+t);this.dateFields[t]=new DateField(e,this)}},loadTimeChooser:function(){for(var t=0;3>t;t++){var e=t==this.curTimeMode?"inherit":"none";$("time-mode-"+t).style.display=e}},loadStatViews:function(t){var e=$("stats");e.innerHTML="",this.statViews=[];for(var a=0;a<t.stats.length;a++){var i=t.stats[a];this.statViews[a]=new StatView(e,i)}},loadData:function(t){if(this.data[0]=t,this.maxMonth=t.vals.length*t.pointJump,t.color="rgb(74,144,226)",t.startOffset=0,t.widthMultiple=1,t.fullRange=this.calcRange(t,0,this.maxMonth),this.firstYear&&t.firstYear!=this.firstYear){var e=12*(this.firstYear-t.firstYear);this.startMonth+=e,this.endMonth+=e,this.startMonth=Math.max(this.startMonth,0),this.endMonth=Math.max(this.endMonth,20)}this.firstYear=t.firstYear,this.endMonth=Math.min(this.endMonth,this.maxMonth),this.scrollBuffer=1,this.clearOverlay(),this.loadStatViews(t),this.draw()},loadOverlay:function(t){this.data[1]=t,t.color="rgb(200,200,200)",t.startOffset=12*(t.firstYear-this.firstYear),t.fullRange=this.calcRange(t,0,t.vals.length),t.widthMultiple=.6,this.draw()},clearOverlay:function(){this.data.length>1&&(this.data.pop(),this.draw())},changeMode:function(){this.curTimeMode=(this.curTimeMode+1)%3,this.loadTimeChooser(),this.draw()},fieldChanged:function(){var t=this.dateFields[this.curTimeMode],e=t.getMonthInRange(this.firstYear,this.maxMonth);if(null!=e&&(this.startMonth=e),0==this.curTimeMode){var a=this.dateFields[3].getMonthInRange(this.firstYear,this.maxMonth)+1;null!=a&&(this.endMonth=a)}else if(1==this.curTimeMode){var i=$("yearCount").value;isNaN(i)||(this.endMonth=this.startMonth+12*i)}this.clampTimespan(),this.draw()},clampTimespan:function(){this.startMonth=Math.min(Math.max(this.startMonth,0),this.maxMonth-12),this.endMonth=Math.min(Math.max(this.endMonth,this.startMonth+12),this.maxMonth)},mouse:function(t){var e=t.clientY-this.canvas.offsetTop-this.canvas.offsetParent.offsetTop,a=t.clientX-this.canvas.offsetParent.offsetLeft-this.canvas.offsetLeft;e>this.scrubGraph.top&&this.mouseDown?this.scrub(a):e<this.bigGraph.bottom&&this.trace(a)},zoom:function(t){var e=t.detail,a=t.wheelDelta,i=225,n=i-1;e=e?a&&(f=a/e)?e/f:-e/1.35:a/120,e=1>e?-1>e?(-Math.pow(e,2)-n)/i:e:(Math.pow(e,2)+n)/i;var r=Math.min(Math.max(e/2,-1),1),s=t.clientX-this.canvas.offsetParent.offsetLeft-this.canvas.offsetLeft,o=this.xToMonth(s),h=(1+r*-.1)*this.scrollBuffer,l=this.startMonth,d=this.endMonth;this.endMonth=Math.round(h*this.endMonth-o*(h-1)),this.startMonth=Math.round(h*this.startMonth+o*(1-h)),this.startMonth!=l&&this.endMonth!=d?this.scrollBuffer=1:h>1&&(this.scrollBuffer=h),this.clampTimespan(),this.draw()},dateText:function(t){var e=String(Math.floor(t/12)+this.firstYear),t=String(t%12);return 1==t.length&&(t="0"+t),e+"/"+t},traceVal:function(t,e){var a=this.toIndex(t,e);return Stats.finalValue.calc(t.vals,0,a)},traceGrowth:function(t,e){var a=this.toIndex(t,this.startMonth),i=this.toIndex(t,e)+1;return Stats.totalGrowth.calc(t.vals,a,i)},trace:function(t){this.draw();var e=this.ctx;e.lineWidth=1,e.strokeStyle="rgb(200,50,50)",e.textAlign="center",e.font="10pt Arial",e.fillStyle="rgb(130,130,130)";var a=this.data[0],i=this.xToMonth(t),n=Math.round(i);i=i%a.pointJump/a.pointJump;var r=a.vals[this.toIndex(a,n)],s=this.valToY(a.curRng,this.bigGraph,r),o=(n-this.startMonth)*(this.width/(this.endMonth-this.startMonth-1));e.fillStyle=a.color,e.beginPath(),e.arc(o,s,6,0,2*Math.PI),e.fill(),e.textAlign="right";var h=this.traceGrowth(a,n),l="-"==h[0]?"red":"green";if(100>s&&300>o&&(s+=100),a.traceShowValue){var d=this.traceVal(a,n);e.fillStyle="black",e.font="14pt Arial";var u=e.measureText(d).width+15;u>o&&(o=u),35>s&&(s+=35),e.fillText(d,o-10,s-17),e.fillStyle=l,e.font="10pt Arial",e.fillText(h,o-10,s-5)}else{e.font="12pt Arial",e.fillStyle=l;var u=e.measureText(h).width+15;u>o&&(o=u),e.fillText(h,o-10,s-5)}},scrub:function(t){var e=this.endMonth-this.startMonth,a=Math.round(t/this.width*this.maxMonth),i=Math.floor(e/2);this.startMonth=a-i,this.endMonth=a+i,this.clampTimespan(),this.draw()},updateTimeFields:function(){var t=Math.round(this.firstYear+this.startMonth/12),e=Math.round(this.firstYear+this.endMonth/12);this.dateFields[this.curTimeMode].setDateFrom(this.startMonth,this.firstYear),0==this.curTimeMode?this.dateFields[3].setDateFrom(this.endMonth-1,this.firstYear):1==this.curTimeMode?$("yearCount").value=e-t:2==this.curTimeMode&&(this.endMonth=this.maxMonth)},updateStats:function(t){for(var e=this.toIndex(t,this.startMonth),a=this.toIndex(t,this.endMonth),i=0;i<this.statViews.length;i++)this.statViews[i].update(t.vals,e,a)},toIndex:function(t,e){return e-=t.startOffset,Math.floor(e/t.pointJump)},indexToMonth:function(t,e){return e*t.pointJump+t.startOffset},xToMonth:function(t){var e=this.endMonth-this.startMonth-1;return this.startMonth+t/(this.width/e)},valToY:function(t,e,a){return e.bottom-(a-t.min)/(t.max-t.min)*(e.bottom-e.top)},calcRange:function(t,e,a){for(var i=1/0,n=0,r=e;a>r;r++)t.vals[r]>n&&(n=t.vals[r]),t.vals[r]<i&&(i=t.vals[r]);return{min:i,max:n}},calcRanges:function(){for(var t=0;t<this.data.length;t++){var e=this.data[t],a=this.toIndex(e,this.startMonth),i=this.toIndex(e,this.endMonth);this.data[t].curRng=this.calcRange(e,a,i)}},draw:function(){if(0!=this.data.length){this.ctx.clearRect(0,0,this.width,this.height),this.updateTimeFields(),this.calcRanges(),this.drawLines(this.bigGraph,this.startMonth,this.endMonth),this.drawStartLevel(this.data[0],this.bigGraph,this.startMonth);for(var t=this.data.length-1;t>=0;t--)this.drawData(this.data[t],this.bigGraph,this.startMonth,this.endMonth,this.data[t].curRng);for(var t=this.data.length-1;t>=0;t--)this.drawData(this.data[t],this.scrubGraph,0,this.maxMonth,this.data[t].fullRange);this.drawWindow(this.scrubGraph),this.updateStats(this.data[0])}},drawLines:function(t,e,a){var i=this.ctx,n=a-e,r=t.width/n,s=20,o=Math.min(12*r/s*.7,.7);(.3>o||!t.yearLines)&&(o=0),i.lineWidth=1,i.textAlign="center",i.font="10pt Arial",i.fillStyle="rgb(130,130,130)";for(var h=e;a>h;h++)if(h%12==0){var l=(h-e)*r,d=Math.floor(this.firstYear+h/12),u=d%10==0;i.strokeStyle=u?"rgb(200,200,200)":"rgba(225,225,225,"+o+")",i.beginPath(),i.moveTo(l,t.lineTop),i.lineTo(l,t.bottom),i.stroke(),u&&t.decadeLabels&&i.fillText(d,l,t.bottom+15)}},drawData:function(t,e,a,i,n){var r=this.ctx,s=this.toIndex(t,a),o=this.toIndex(t,i),h=o-s,l=this.width/(i-a-1),d=1==t.pointJump?Math.ceil(h/e.width):1;r.strokeStyle=t.color,r.lineWidth=e.lineWidth*t.widthMultiple,r.lineJoin="round",r.beginPath();var u=this.valToY(n,e,t.vals[s]);r.moveTo((this.indexToMonth(t,s)-a)*l,u);for(var c=s;o>c;c+=d){var f=this.valToY(n,e,t.vals[c]),v=(this.indexToMonth(t,c)-a)*l;r.lineTo(v,f)}r.stroke()},drawStartLevel:function(t,e,a){var i=this.ctx,n=this.toIndex(t,a),r=this.valToY(t.curRng,e,t.vals[n]);i.strokeStyle="#999999",i.lineWidth=1,i.beginPath(),i.moveTo(0,r),i.lineTo(e.width,r),i.stroke()},drawWindow:function(t){this.ctx.fillStyle=t.windowColor;var e=this.startMonth/this.maxMonth*t.width,a=this.endMonth/this.maxMonth*t.width;this.ctx.fillRect(e,t.top,a-e,t.bottom-t.top)}},Stats={_calcTotalGrowth:function(t,e,a){return t[a-1]/t[e]},_calcAverage:function(t,e,a){for(var i=0,n=e;a>n;n++)i+=t[n];var r=i/(a-e);return r},totalGrowth:{calc:function(t,e,a){var i=Stats._calcTotalGrowth(t,e,a),n=String((100*(i-1)).formatMoney(2,".",","))+"%";return n},name:"Total Growth"},dollarsNow:{calc:function(t,e,a){var i=Stats._calcTotalGrowth(t,e,a),n="$"+i.formatMoney(2,".",",");return n},name:"$1 Becomes",description:"If $1 was invested at the beginning of this time period, what would it be by the end?"},averageGrowth:{calc:function(t,e,a){var i=Stats._calcTotalGrowth(t,e,a),n=Math.pow(i,12/(a-e))-1,r=String((100*n).toFixed(2))+"%";return r},name:"Annual Growth",description:"The CAGR, defined as the rate of constant growth that would produce the same return over the given time period."},averageGrowthQuarterly:{calc:function(t,e,a){var i=Stats._calcTotalGrowth(t,e,a),n=Math.pow(i,12/(3*(a-e)))-1,r=String((100*n).toFixed(2))+"%";return r},name:"Annual Growth",description:"The CAGR, defined as the rate of constant growth that would produce the same return over the given time period."},timesDoubled:{calc:function(t,e,a){var i=Stats._calcTotalGrowth(t,e,a),n=Math.log(i)/Math.log(2),r=String(n.toFixed(2));return r},name:"Times Doubled"},averagePercent:{calc:function(t,e,a){var i=Stats._calcAverage(t,e,a),n=String((100*i).toFixed(2))+"%";return n},name:"Average"},average:{calc:function(t,e,a){var i=Stats._calcAverage(t,e,a),n=i.formatMoney(2,".",",");return n},name:"Average"},finalValue:{calc:function(t,e,a){var i=t[a],n=i.formatMoney(2,".",",");return n},name:"Final Value"}},defaultStats=[Stats.totalGrowth,Stats.averageGrowth,Stats.dollarsNow,Stats.timesDoubled],shillerInfo="Historical S&P500 data from <a href='http://www.econ.yale.edu/~shiller/data.htm'>Robert Shiller</a>.",shillerHousing="Data from <a href='http://www.econ.yale.edu/~shiller/data.htm'>Robert Shiller</a>.",dataSets=[{name:"S&P500 (With Dividends)",notes:shillerInfo+" Not inflation adjusted. Includes reinvested dividends.",file:"shiller_absolute.json",group:"s&pIndex",stats:defaultStats,startYear:function(t){return t.start},datFunc:reinvestDividends},{name:"S&P500",notes:shillerInfo+" Not inflation adjusted. Dividends not reinvested.",file:"shiller_absolute.json",group:"s&pIndex",goodOverlay:!0,traceShowValue:!0,stats:defaultStats,startYear:function(t){return t.start},datFunc:function(t){return t.price}},{name:"Real S&P500 (With Dividends)",notes:shillerInfo+" Inflation adjusted. Includes reinvested dividends.",file:"shiller_real.json",group:"s&pIndex",stats:defaultStats,startYear:function(t){return t.start},datFunc:reinvestDividends},{name:"Real S&P500",notes:shillerInfo+" Inflation adjusted. Dividends not reinvested.",file:"shiller_real.json",group:"s&pIndex",traceShowValue:!0,stats:defaultStats,startYear:function(t){return t.start},datFunc:function(t){return t.price}},{name:"S&P500 Dividend Yield",notes:"Yearly dividend as a percentage of price. "+shillerInfo,file:"shiller_absolute.json",goodOverlay:!0,traceShowValue:!0,stats:[Stats.averagePercent],startYear:function(t){return t.start},datFunc:function(t){for(var e=[],a=0;a<t.price.length;a++)e[a]=t.dividend[a]/t.price[a];return e}},{name:"Shiller P/E10 Ratio",notes:"Inflation adjusted price per dollar of average earnings over past 10 years. "+shillerInfo,file:"shiller_real.json",goodOverlay:!0,traceShowValue:!0,stats:[Stats.average],startYear:function(t){return t.start+10},datFunc:function(t){for(var e=[],a=120,i=a-1;i<t.earnings.length;i++){for(var n=0,r=0;a>r;r++)n+=t.earnings[i-r];e[i-a]=t.price[i]/(n/a)}return e}},{name:"S&P500 P/E Ratio",notes:"Inflation adjusted price per dollar of adjusted earnings. "+shillerInfo,file:"shiller_real.json",goodOverlay:!0,traceShowValue:!0,stats:[Stats.average],startYear:function(t){return t.start},datFunc:function(t){for(var e=[],a=0;a<t.earnings.length;a++)e[a]=t.price[a]/t.earnings[a];return e}},{name:"S&P500 Real Earnings",notes:"Inflation adjusted earnings per share. "+shillerInfo,file:"shiller_real.json",goodOverlay:!0,traceShowValue:!0,stats:defaultStats,startYear:function(t){return t.start},datFunc:function(t){return t.earnings}},{name:"Shiller Home Price Index",notes:"Index that approxmately tracks the price of housing, adjusted for inflation. "+shillerHousing,file:"shiller_housing.json",goodOverlay:!0,traceShowValue:!0,pointJump:3,stats:[Stats.totalGrowth,Stats.averageGrowthQuarterly,Stats.dollarsNow,Stats.timesDoubled],startYear:function(t){return t.start},datFunc:function(t){return t.price}},{name:"Shiller Building Cost Index",notes:"Index that approxmately tracks the cost of building, adjusted for inflation. "+shillerHousing,file:"shiller_housing.json",goodOverlay:!0,traceShowValue:!0,pointJump:12,stats:[Stats.totalGrowth,Stats.timesDoubled,Stats.average],startYear:function(t){return t.start},datFunc:function(t){return t.building}},{name:"Long Term Borrowing Rate",notes:"Interest rate for long term loans. "+shillerHousing,file:"shiller_housing.json",goodOverlay:!0,traceShowValue:!0,pointJump:12,stats:[Stats.average],startYear:function(t){return t.start},datFunc:function(t){return t.longRate}},{name:"U.S Population",notes:"U.S Population in millions. "+shillerHousing,file:"shiller_housing.json",traceShowValue:!0,pointJump:12,stats:[Stats.totalGrowth,Stats.timesDoubled,Stats.finalValue,Stats.average],startYear:function(t){return t.start},datFunc:function(t){for(var e=[],a=0;a<t.population.length;a++)e[a]=1e6*t.population[a];return e}}],dataFileCache={};window.addEventListener("resize",sizeCanvas,!1);