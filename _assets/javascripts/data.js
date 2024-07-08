var defaultStats = [Stats.totalGrowth, Stats.averageGrowth, Stats.dollarsNow, Stats.timesDoubled];
var shillerInfo = "Historical S&P500 data from <a href='http://www.econ.yale.edu/~shiller/data.htm'>Robert Shiller</a>.";
var shillerHousing = "Data from <a href='http://www.econ.yale.edu/~shiller/data.htm'>Robert Shiller</a>.";
var dataSets = [
  {
    name: "S&P500 (With Dividends)",
    notes: shillerInfo + " Not inflation adjusted. Includes reinvested dividends.",
    file: "shiller_absolute.json",
    group: "s&pIndex",
    stats: defaultStats,
    startYear: function(struct) {return struct["start"];},
    datFunc: reinvestDividends
  },
  {
    name: "S&P500",
    notes: shillerInfo + " Not inflation adjusted. Dividends not reinvested.",
    file: "shiller_absolute.json",
    group: "s&pIndex",
    goodOverlay: true,
    traceShowValue: true,
    stats: defaultStats,
    startYear: function(struct) {return struct["start"];},
    datFunc: function(struct) {
      return struct["price"];
    }
  },
  {
    name: "Real S&P500 (With Dividends)",
    notes: shillerInfo + " Inflation adjusted. Includes reinvested dividends.",
    file: "shiller_real.json",
    group: "s&pIndex",
    stats: defaultStats,
    startYear: function(struct) {return struct["start"];},
    datFunc: reinvestDividends
  },
  {
    name: "Real S&P500",
    notes: shillerInfo + " Inflation adjusted. Dividends not reinvested.",
    file: "shiller_real.json",
    group: "s&pIndex",
    traceShowValue: true,
    stats: defaultStats,
    startYear: function(struct) {return struct["start"];},
    datFunc: function(struct) {
      return struct["price"];
    }
  },
  {
    name: "S&P500 Dividend Yield",
    notes: "Yearly dividend as a percentage of price. " + shillerInfo,
    file: "shiller_absolute.json",
    goodOverlay: true,
    traceShowValue: true,
    stats: [Stats.averagePercent],
    startYear: function(struct) {return struct["start"];},
    datFunc: function(struct) {
      var newData = [];
      for (var i = 0; i < struct["price"].length; i++) {
        newData[i] = struct["dividend"][i]/struct["price"][i];
      }
      return newData;
    }
  },
  {
    name: "Shiller P/E10 Ratio",
    notes: "Inflation adjusted price per dollar of average earnings over past 10 years. " + shillerInfo,
    file: "shiller_real.json",
    goodOverlay: true,
    traceShowValue: true,
    stats: [Stats.average],
    startYear: function(struct) {return struct["start"]+10;},
    datFunc: function(struct) {
      var newData = [];
      var numPrev = 10*12;
      for (var i = numPrev-1; i < struct["earnings"].length; i++) {
        var total = 0;
        for (var j = 0; j < numPrev; j++) {
          total += struct["earnings"][i-j];
        }
        newData[i-numPrev] = struct["price"][i]/(total/numPrev);
      }
      return newData;
    }
  },
  {
    name: "S&P500 P/E Ratio",
    notes: "Inflation adjusted price per dollar of adjusted earnings. " + shillerInfo,
    file: "shiller_real.json",
    goodOverlay: true,
    traceShowValue: true,
    stats: [Stats.average],
    startYear: function(struct) {return struct["start"];},
    datFunc: function(struct) {
      var newData = [];
      for (var i = 0; i < struct["earnings"].length; i++) {
        newData[i] = struct["price"][i]/struct["earnings"][i];
      }
      return newData;
    }
  },
  {
    name: "S&P500 Real Earnings",
    notes: "Inflation adjusted earnings per share. " + shillerInfo,
    file: "shiller_real.json",
    goodOverlay: true,
    traceShowValue: true,
    stats: defaultStats,
    startYear: function(struct) {return struct["start"];},
    datFunc: function(struct) {
      return struct["earnings"];
    }
  },
  {
    name: "Shiller Home Price Index",
    notes: "Index that approximately tracks the price of housing, adjusted for inflation. " + shillerHousing,
    file: "shiller_housing.json",
    goodOverlay: true,
    traceShowValue: true,
    pointJump: 3, // Quarterly data
    stats: [Stats.totalGrowth, Stats.averageGrowthQuarterly, Stats.dollarsNow, Stats.timesDoubled],
    startYear: function(struct) {return struct["start"];},
    datFunc: function(struct) {
      return struct["price"];
    }
  },
  {
    name: "Shiller Building Cost Index",
    notes: "Index that approximately tracks the cost of building, adjusted for inflation. " + shillerHousing,
    file: "shiller_housing.json",
    goodOverlay: true,
    traceShowValue: true,
    pointJump: 12, // Yearly
    stats: [Stats.totalGrowth, Stats.timesDoubled, Stats.average],
    startYear: function(struct) {return struct["start"];},
    datFunc: function(struct) {
      return struct["building"];
    }
  },
  {
    name: "Long Term Borrowing Rate",
    notes: "Interest rate for long term loans. " + shillerHousing,
    file: "shiller_housing.json",
    goodOverlay: true,
    traceShowValue: true,
    pointJump: 12, // Yearly
    stats: [Stats.average],
    startYear: function(struct) {return struct["start"];},
    datFunc: function(struct) {
      return struct["longRate"];
    }
  },
  {
    name: "U.S Population",
    notes: "U.S Population in millions. " + shillerHousing,
    file: "shiller_housing.json",
    traceShowValue: true,
    pointJump: 12, // Yearly
    stats: [Stats.totalGrowth, Stats.timesDoubled, Stats.finalValue, Stats.average],
    startYear: function(struct) {return struct["start"];},
    datFunc: function(struct) {
      var newData = [];
      for (var i = 0; i < struct["population"].length; i++) {
        newData[i] = struct["population"][i]*1000000;
      }
      return newData;
    }
  },
];
var dataFileCache = {};

function overlaySets(curSet) {
  var sets = [{name: "None"}];
  var filter = dataSets.filter(function(set) {
    return set.goodOverlay && set.name != curSet.name &&
    (set.group != curSet.group || set.group == null);
  });
  return sets.concat(filter);
}

function reinvestDividends(struct) {
  var newData = [1.0];
  var price = struct["price"];
  var dividend = struct["dividend"];

  for (var i = 1; i < price.length; i++) {
    var grownVal = (price[i]/price[i-1]);
    grownVal += (dividend[i]/12.0)/price[i];
    grownVal *= newData[i-1];
    newData[i] = grownVal;
  };

  return newData;
}

function loadDataFile(fileName) {
  if(dataFileCache[fileName]) {
    return dataFileCache[fileName];
  }

  xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", "datasets/"+fileName, false);
  xmlhttp.send();

  if(xmlhttp.status == 200) {
    var json = JSON.parse(xmlhttp.responseText);
    dataFileCache[fileName] = json;
    return json;
  } else {
    alert("Failed to get "+fileName);
    return null;
  }
}

function getDataSetStruct(set) {
  var struct = loadDataFile(set.file);
  return {
    vals: set.datFunc(struct),
    firstYear: set.startYear(struct),
    stats: set.stats,
    traceShowValue: set.traceShowValue,
    pointJump: (set.pointJump || 1)
  }
}
