var Viewer = {
loadCanvas: function () {
  this.canvas = $('graph');
  if (this.canvas.getContext) {
    // var dpr = window.devicePixelRatio || 1;
    // var rect = this.canvas.getBoundingClientRect();
    // this.canvas.width = rect.width * dpr;
    // this.canvas.height = rect.height * dpr;
    this.ctx = this.canvas.getContext('2d');
    // this.ctx.scale(dpr,dpr);

    var _zoom = this.zoom.bind(this);
    var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel";
    this.canvas.addEventListener(mousewheelevt,function(event) {
        _zoom(event);
        event.preventDefault();
        return false;
    }, false);

    var _mouse = this.mouse.bind(this);
    this.canvas.addEventListener('mousemove', function (e) {
        _mouse(e);
    }, false);

    var _this = this;
    this.mouseDown = false;
    this.canvas.addEventListener('mousedown', function (e) {
      _this.mouseDown = true;
    }, false);
    this.canvas.addEventListener('mouseup', function (e) {
      _this.mouseDown = false;
    }, false);

  }

  this.bigGraph = {
    top: 20,
    bottom: 240,
    lineWidth: 4,
    lineTop: 0,
    decadeLabels: true,
    yearLines: true
  };

  this.scrubGraph = {
    top: 270,
    bottom: 300,
    lineWidth: 2,
    windowColor: "rgba(100,100,100,0.2)",
    lineTop: 290,
    decadeLabels: false,
    yearLines: false
  };

  this.curTimeMode = 0;
  this.loadDateFields();
  this.loadTimeChooser();

  // startMonth is an inclusive start
  this.startMonth = 1200;
  // endMonths is an exclusive end
  this.endMonth = Infinity;

  this.data = [];

  this.loadSize();
},

loadSize: function() {
  // this.width = this.canvas.clientWidth;
  // this.height = this.canvas.clientHeight;

  // this.canvas.height = this.height;
  // this.canvas.width = this.width;
  var dpr = window.devicePixelRatio || 1;
  this.width = this.canvas.width / dpr;
  this.height = this.canvas.height / dpr;
  this.ctx.scale(dpr,dpr);

  this.bigGraph.width = this.width;
  this.bigGraph.bottom = this.height - 70;
  this.scrubGraph.width = this.width;
  this.scrubGraph.top = this.height - 40;
  this.scrubGraph.bottom = this.height;

  this.draw();
},

loadDateFields: function() {
  this.dateFields = [];
  for (var i = 0; i <= 3; i++) {
    var elem = $('date-field-'+i);
    this.dateFields[i] = new DateField(elem, this);
  };
},

loadTimeChooser: function() {
  for (var i = 0; i < 3; i++) {
    var status = (i == this.curTimeMode) ? 'inherit' : 'none';
    $('time-mode-'+i).style.display = status;
  }
},

loadStatViews: function(data) {
  var statsNode = $('stats');
  statsNode.innerHTML = '';

  this.statViews = [];

  for (var i = 0; i < data.stats.length; i++) {
    var stat = data.stats[i];
    this.statViews[i] = new StatView(statsNode, stat);
  };
},

loadData: function (data) {
  this.data[0] = data;
  this.maxMonth = data.vals.length * data.pointJump;

  data.color = "rgb(74,144,226)";
  data.startOffset = 0;
  data.widthMultiple = 1.0;
  data.fullRange = this.calcRange(data, 0, this.maxMonth);

  // What if we zoom to 1890 and then switch to a set starting in 1870
  if(this.firstYear && data.firstYear != this.firstYear) {
    var delta = (this.firstYear - data.firstYear)*12;
    this.startMonth += delta;
    this.endMonth += delta;
    this.startMonth = Math.max(this.startMonth, 0);
    this.endMonth   = Math.max(this.endMonth, 20);
  }

  this.firstYear = data.firstYear;
  this.endMonth = Math.min(this.endMonth, this.maxMonth);
  this.scrollBuffer = 1.0;

  this.clearOverlay();
  this.loadStatViews(data);

  this.draw();
},

loadOverlay: function(data) {
  this.data[1] = data;
  data.color = "rgb(200,200,200)";
  data.startOffset = (data.firstYear - this.firstYear) * 12;
  data.fullRange = this.calcRange(data, 0, data.vals.length);
  data.widthMultiple = 0.6;
  this.draw();
},

clearOverlay: function() {
  if(this.data.length > 1) {
    this.data.pop();
    this.draw();
  }
},

changeMode: function() {
  this.curTimeMode = (this.curTimeMode + 1) % 3;
  this.loadTimeChooser();
  this.draw();
},

fieldChanged: function() {
  var startField = this.dateFields[this.curTimeMode];
  var startMonth = startField.getMonthInRange(this.firstYear, this.maxMonth);
  if(startMonth != null) {
    this.startMonth = startMonth;
  }

  if(this.curTimeMode == 0) {
    // +1 because we want date fields inclusive but this.endMonth exclusive
    var endMonth = this.dateFields[3].getMonthInRange(this.firstYear,this.maxMonth)+1;

    if(endMonth != null) {
      this.endMonth = endMonth;
    }
  } else if(this.curTimeMode == 1) {
    var yearCount = $('yearCount').value;

    if(!isNaN(yearCount)) {
      this.endMonth = this.startMonth + yearCount*12;
    }
  }

  this.clampTimespan();

  this.draw();
},

clampTimespan: function() {
  this.startMonth = Math.min(Math.max(this.startMonth,0), this.maxMonth-12);
  this.endMonth   = Math.min(Math.max(this.endMonth,this.startMonth+12), this.maxMonth);
},

mouse: function(event) {
  var y = event.clientY - this.canvas.offsetTop - this.canvas.offsetParent.offsetTop;
  var x = event.clientX - this.canvas.offsetParent.offsetLeft - this.canvas.offsetLeft;
  if(y > this.scrubGraph.top && this.mouseDown) {
    this.scrub(x);
  } else if(y < this.bigGraph.bottom) {
    this.trace(x);
  }
},

zoom: function (event) {
  // Cross browser mouse wheel scale
  var d = event.detail, w = event.wheelDelta,
      n = 225, n1 = n-1;
  // Normalize delta
  d = d ? w && (f = w/d) ? d/f : -d/1.35 : w/120;
  // Quadratic scale if |d| > 1
  d = d < 1 ? d < -1 ? (-Math.pow(d, 2) - n1) / n : d : (Math.pow(d, 2) + n1) / n;
  // Delta *should* not be greater than 2...
  var delta = Math.min(Math.max(d / 2, -1), 1);

  var mouseX = event.clientX - this.canvas.offsetParent.offsetLeft - this.canvas.offsetLeft;

  var centerMonth = this.xToMonth(mouseX);
  var factor = (1 + delta * -0.1) * this.scrollBuffer;
  var prevStart = this.startMonth, prevEnd = this.endMonth;
  this.endMonth = Math.round(factor*this.endMonth - centerMonth*(factor - 1));
  this.startMonth = Math.round(factor*this.startMonth + centerMonth*(1 - factor));

  if(this.startMonth != prevStart && this.endMonth != prevEnd) {
    this.scrollBuffer = 1.0;
  } else if(factor > 1.0) {
    this.scrollBuffer = factor;
  }

  this.clampTimespan();
  this.draw();
},

dateText: function(month) {
  var year = String(Math.floor(month / 12) + this.firstYear);
  var month = String(month % 12);
  if(month.length == 1 ) month = "0" + month;
  return year + "/" + month;
},

traceVal: function(data, month) {
  var end = this.toIndex(data, month);
  return Stats.finalValue.calc(data.vals,0, end);
},

traceGrowth: function(data, month) {
  var start = this.toIndex(data, this.startMonth);
  var end = this.toIndex(data, month)+1;
  return Stats.totalGrowth.calc(data.vals, start, end);
},

trace: function(mouseX) {
  this.draw();

  var ctx = this.ctx;

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgb(200,50,50)"
  ctx.textAlign = "center";
  ctx.font = "10pt Arial";
  ctx.fillStyle = "rgb(130,130,130)";

  var data = this.data[0];
  var fmonth = this.xToMonth(mouseX);
  var month = Math.round(fmonth);
  fmonth = (fmonth % data.pointJump) / data.pointJump;

  var val = data.vals[this.toIndex(data, month)];
  var y = this.valToY(data.curRng, this.bigGraph, val);
  var x = (month-this.startMonth) * (this.width/(this.endMonth-this.startMonth-1));

  // trace dot
  ctx.fillStyle = data.color;
  ctx.beginPath();
  ctx.arc(x,y,6,0,2*Math.PI);
  ctx.fill();

  // text
  ctx.textAlign = "right";
  var growthText = this.traceGrowth(data, month);
  var growStyle = (growthText[0] == "-") ? "red" : "green";
  if(y < 100 && x < 300) y += 100;
  if(data.traceShowValue) {
    var valText = this.traceVal(data, month);
    ctx.fillStyle = "black";
    ctx.font = "14pt Arial";
    var textW = ctx.measureText(valText).width+15;
    if(x < textW) x = textW;
    if(y < 35) y += 35;
    ctx.fillText(valText, x - 10, y - 17);
    ctx.fillStyle = growStyle;
    ctx.font = "10pt Arial";
    ctx.fillText(growthText, x - 10, y - 5);
  } else {
    ctx.font = "12pt Arial";
    ctx.fillStyle = growStyle;
    var textW = ctx.measureText(growthText).width+15;
    if(x < textW) x = textW;
    ctx.fillText(growthText, x - 10, y - 5);
  }

},

scrub: function(x) {
  var span = this.endMonth - this.startMonth;
  var target = Math.round(x/this.width*this.maxMonth);
  var half = Math.floor(span/2);
  this.startMonth = target - half;
  this.endMonth = target + half;

  this.clampTimespan();
  this.draw();
},

updateTimeFields: function() {
  var startYear = Math.round(this.firstYear + (this.startMonth/12));
  var endYear = Math.round(this.firstYear + (this.endMonth/12));

  this.dateFields[this.curTimeMode].setDateFrom(this.startMonth, this.firstYear);
  if(this.curTimeMode == 0) {
    // -1 because we want date fields inclusive but this.endMonth exclusive
    this.dateFields[3].setDateFrom(this.endMonth-1, this.firstYear);
  } else if(this.curTimeMode == 1) {
    $('yearCount').value = endYear - startYear;
  } else if(this.curTimeMode == 2) {
    this.endMonth = this.maxMonth;
  }
},

updateStats: function (data) {
  var start = this.toIndex(data, this.startMonth);
  var end = this.toIndex(data, this.endMonth);

  for (var i = 0; i < this.statViews.length; i++) {
    this.statViews[i].update(data.vals, start, end);
  };
},

toIndex: function (data,n) {
  n = n - data.startOffset;
  return Math.floor(n/data.pointJump);
},

indexToMonth: function(data, i) {
  return i*data.pointJump + data.startOffset;
},

xToMonth: function(x) {
  var span = this.endMonth-this.startMonth-1;
  return this.startMonth + x/(this.width/span);
},

valToY: function(rng, graph, val) {
   return graph.bottom - (val-rng.min)/(rng.max-rng.min)*(graph.bottom - graph.top);
},

calcRange: function (data, start, end) {
  var min = Infinity;
  var max = 0.0;
  for (var i = start; i < end; i++) {
    if(data.vals[i]>max) max = data.vals[i];
    if(data.vals[i]<min) min = data.vals[i];
  };
  return {"min": min, "max": max};
},

calcRanges: function () {
  for (var i = 0; i < this.data.length; i++) {
    var data = this.data[i];
    var start = this.toIndex(data, this.startMonth);
    var end = this.toIndex(data, this.endMonth);
    this.data[i].curRng = this.calcRange(data, start, end);
  };
},

draw: function () {
  if(this.data.length == 0) return;
  this.ctx.clearRect(0,0,this.width, this.height);

  this.updateTimeFields();

  this.calcRanges();

  this.drawLines(this.bigGraph, this.startMonth, this.endMonth);
  this.drawStartLevel(this.data[0], this.bigGraph, this.startMonth);
  for (var i = this.data.length - 1; i >= 0; i--) {
    this.drawData(this.data[i], this.bigGraph, this.startMonth, this.endMonth, this.data[i].curRng);
  };

  // scrub graph
  //this.drawLines(this.scrubGraph, 0, this.maxMonth);
  for (var i = this.data.length - 1; i >= 0; i--) {
    this.drawData(this.data[i], this.scrubGraph, 0, this.maxMonth, this.data[i].fullRange);
  };
  this.drawWindow(this.scrubGraph);

  this.updateStats(this.data[0]);
},

drawLines: function(opt, startMonth, endMonth){
  var ctx = this.ctx;
  var span = endMonth-startMonth;
  var dx = (opt.width/span);

  var minSpace = 20;
  var alpha = Math.min((dx*12)/minSpace*0.7,0.7);
  if (alpha < 0.3 || !opt.yearLines) alpha = 0.0;

  ctx.lineWidth = 1;
  ctx.textAlign = "center";
  ctx.font = "10pt Arial";
  ctx.fillStyle = "rgb(130,130,130)";

  for (var i = startMonth; i < endMonth; i++) {
    if (i % 12 == 0) {
      var x = (i-startMonth)*dx;
      var curYear = Math.floor(this.firstYear + i/12)
      var isDecade =  curYear % 10 == 0;

      if(isDecade) {
        ctx.strokeStyle = "rgb(200,200,200)";
      } else {
        ctx.strokeStyle = "rgba(225,225,225,"+alpha+")";
      }

      ctx.beginPath();
      ctx.moveTo(x,opt.lineTop);
      ctx.lineTo(x,opt.bottom);
      ctx.stroke();

      if(isDecade && opt.decadeLabels) {
        ctx.fillText(curYear, x, opt.bottom + 15);
      }
    }
  }
},

drawData: function (data, graph, startMonth, endMonth, rng){
  var ctx = this.ctx;
  var start = this.toIndex(data, startMonth);
  var end = this.toIndex(data, endMonth);
  var span = end-start;
  var dx = (this.width/(endMonth-startMonth-1));
  var jump = (data.pointJump == 1) ? Math.ceil(span/graph.width) : 1;

  // Graph
  ctx.strokeStyle = data.color;
  ctx.lineWidth = graph.lineWidth * data.widthMultiple;
  ctx.lineJoin = "round";

  ctx.beginPath();
  var y1 = this.valToY(rng, graph, data.vals[start]);
  ctx.moveTo((this.indexToMonth(data,start) - startMonth)*dx,y1);
  for (var i = start; i < end; i+=jump) {
    var y = this.valToY(rng, graph, data.vals[i]);
    var x = (this.indexToMonth(data,i) - startMonth)*dx;
    ctx.lineTo(x,y);
  };
  ctx.stroke();
},

drawStartLevel: function(data, graph, startMonth) {
  var ctx = this.ctx;
  var start = this.toIndex(data, startMonth);
  var y = this.valToY(data.curRng, graph, data.vals[start]);

  ctx.strokeStyle = "#999999";
  ctx.lineWidth = 1;

  ctx.beginPath()
  ctx.moveTo(0, y);
  ctx.lineTo(graph.width, y);
  ctx.stroke();
},

drawWindow: function(opt) {
  this.ctx.fillStyle = opt.windowColor;

  var x1 = this.startMonth/this.maxMonth*opt.width;
  var x2 = this.endMonth/this.maxMonth*opt.width;
  this.ctx.fillRect(x1, opt.top, x2-x1, opt.bottom-opt.top);
}
};
