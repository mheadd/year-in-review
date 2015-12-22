$(document).ready(function() {

  // Hide chart headers & footer on page load.
  $(".lead, #working").hide();

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
var sqlYearlyString = 'SELECT SUM(CASE WHEN SUBSTRING("IssuedDate",1,4) = \'2015\' THEN 1 ELSE 0 END) AS "2015_PERMITS", SUM(CASE WHEN SUBSTRING("IssuedDate",1,4) = \'2014\' THEN 1 ELSE 0 END) AS "2014_PERMITS" FROM "%resource_id%"';
var sqlYearlyTypeString = 'SELECT SUM(1) AS "Total", "PermitTypeMapped" FROM "%resource_id%" WHERE "PermitTypeMapped" <> \'\' AND SUBSTRING("IssuedDate",1,4) = \'2015\' GROUP BY "PermitTypeMapped"';

// Summary text displayed with charts.
var summaryText = 'In 2015, name handled amount% more building permits than in 2014.';

// Method to display chrts.
function showCharts(city) {

  // Hide the jumbotron & logos.
  $(".jumbotron, .logos, .message").hide();

  // Clear any existing charts.
  $("h3, .footer").hide();
  $("#annual, #type").empty();
  $("#summary").text("");

  // Render yearly and monthly summaries.
  getYearlyTotals(city);
  getYearlyTotalsByType(city);
}

// Get Yearly summary.
function getYearlyTotals(city) {

  requestJSON(formatSQLSting(sqlYearlyString, city), function(json) {
    var _2014 = json.result.records[0]["2014_PERMITS"];
    var _2015 = json.result.records[0]["2015_PERMITS"];
    var change = Math.round(((_2015 - _2014)/_2014)*100);
    
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
          ['2014', _2014],
          ['2015', _2015]
        ],
        type: 'bar',
        labels: true,
        labels: {
            format: {
                2014: d3.format(','),
                2015: d3.format(',')
            }
        }
      }
    });
  });

}

// Get monthly summary.
function getYearlyTotalsByType(city) {

  requestJSON(formatSQLSting(sqlYearlyTypeString, city), function(json) {
    var values = [];
    for(var i=0; i<json.result.records.length; i++) {
      values.push(new Array(json.result.records[i]["PermitTypeMapped"], parseInt(json.result.records[i]["Total"])));
    }
    $("#permittype").show();
    makeCharts({
      bindto: "#type",
      data: {
        columns: values,
        type: 'pie',
        labels: true
      }
    });
  });
}

// Make API call.
function requestJSON(sql, callback) {
  $.ajax({
    url: urlBase + sql,
    beforeSend: function() {
      $(".lead").hide();
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
  return sql.replace('%resource_id%', city.resource_id);
}