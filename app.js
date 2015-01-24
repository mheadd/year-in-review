$(document).ready(function() {

  // Hide chart headers & footer on page load.
  $("h3, .footer, #working").hide();

  // Get the city name from the URL path and show charts. 
  // if(window.location.pathname.length > 1) {
  //   var plug = window.location.pathname.replace('/', '');
  //   var city = cities[plug];
  //   showCharts(city);
  // }

  $(".city").click(function(e){
    // Get the city selected.
    var city = cities[this.id];
    showCharts(city);
    e.preventDefault();
  });

});

// API base URL and SQL strings.
var urlBase = 'http://www.civicdata.com/api/action/datastore_search_sql?sql=';
var sqlYearlyString = 'SELECT SUM(CASE WHEN SUBSTRING("%date_field%",1,4) = \'2014\' THEN 1 ELSE 0 END) AS "2014_PERMITS", SUM(CASE WHEN SUBSTRING("%date_field%",1,4) = \'2013\' THEN 1 ELSE 0 END) AS "2013_PERMITS" FROM "%resource_id%"';
var sqlMonthlyString = 'SELECT SUBSTRING("%date_field%",6,2) AS "MONTH", SUM(CASE WHEN SUBSTRING("%date_field%",1,4) = \'2014\' THEN 1 ELSE 0 END) AS "2014_PERMITS", SUM(CASE WHEN SUBSTRING("%date_field%",1,4) = \'2013\' THEN 1 ELSE 0 END) AS "2013_PERMITS" FROM "%resource_id%" GROUP BY "MONTH" ORDER BY "MONTH" ASC';

// Summary text displayed with charts.
var summaryText = 'In 2014, name handled amount% more building permits than in 2013.';

// Method to display chrts.
function showCharts(city) {

  // Hide the jumbotron & logos.
  $(".jumbotron").hide();
   $("#logos").hide();

  // Clear any existing charts.
  $("h3, .footer").hide();
  $("#annual, #monthly").empty();
  $("#summary").text("");

  // Render yearly and monthly summaries.
  getYearlyTotals(city);
  getMonthlyTotals(city);
}

// Get Yearly summary.
function getYearlyTotals(city) {

  requestJSON(formatSQLSting(sqlYearlyString, city), function(json) {
    var _2013 = json.result.records[0]["2013_PERMITS"];
    var _2014 = json.result.records[0]["2014_PERMITS"];
    var change = Math.round(((_2014 - _2013)/_2013)*100);
    
    // Change the language in the summary text to reflect change in permits numbers.
    if(change < 0) {
      change = change * -1;
      var summary = summaryText.replace('more', 'fewer').replace('amount', change).replace('name', city.name);
    }
    else {
      var summary = summaryText.replace('amount', change).replace('name', city.name);
    }

    $("#summary").text(summary);
    $("#year").show();
    makeCharts({
      bindto: "#annual",
      data: {
        columns: [
          ['2013', _2013],
          ['2014', _2014]
        ],
        type: 'bar',
        labels: true
      },
      bar: {
        width: {
          ratio: 0.5 
        }
      }
    });
  });

}

// Get monthly summary.
function getMonthlyTotals(city) {

  requestJSON(formatSQLSting(sqlMonthlyString, city), function(json) {
    var _2013 = ['2013'];
    var _2014 = ['2014'];
    for(var i=0; i<json.result.records.length; i++) {
      _2013.push(json.result.records[i]["2013_PERMITS"]);
      _2014.push(json.result.records[i]["2014_PERMITS"]);
    }
    $("#month").show();
    makeCharts({
      bindto: "#monthly",
      data: {
        columns: [_2013, _2014],
        labels: true
      },
      axis: {
        x: {
          type: 'category',
          categories: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'Septembr', 'October', 'November', 'December']
        }
      }
    });
  });
}

// Make API call.
function requestJSON(sql, callback) {
  $.ajax({
    url: urlBase + sql,
    beforeSend: function() {
      $("#working").show();
    },
    complete: function(xhr) {
       $("#working").hide();
       $(".footer").show();
      callback.call(null, xhr.responseJSON);
    }
  });
}

// Utiluty method to generate C3 Chart.
function makeCharts(chart) {
  var chart = c3.generate(chart);
}

// Utility method to format SQL string for API call.
function formatSQLSting(sql, city) {
  return sql.replace(/%date_field%/g, city.date_field).replace('%resource_id%', city.resource_id);
}