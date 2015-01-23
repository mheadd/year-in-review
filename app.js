      $(document).ready(function() {

      // Hide chart headers on page load.
      $("h2").hide();

      // Selection handler.
      $(".city").click(function(e){

        // Hide the jumbotron & logos.
        $(".jumbotron").hide();
        $("#logos").hide();

        // Get the city selected.
        var city = this.id;

        getYearlyTotals();
        getMonthlyTotals();

        e.preventDefault();
        
      });

      });


// API base URL and SQL strings.
var urlBase = 'http://www.civicdata.com/api/action/datastore_search_sql?sql=';
var sqlYearlyString = 'SELECT SUM(CASE WHEN SUBSTRING("DATE OPENED",1,4) = \'2014\' THEN 1 ELSE 0 END) AS "2014_PERMITS", SUM(CASE WHEN SUBSTRING("DATE OPENED",1,4) = \'2013\' THEN 1 ELSE 0 END) AS "2013_PERMITS" FROM "94701a46-ee4a-4f42-8bea-b80ce10041a8" WHERE "RECORD MODULE" = \'Building\'';
var sqlMonthlyString = 'SELECT SUBSTRING("DATE OPENED",6,2) AS "MONTH", SUM(CASE WHEN SUBSTRING("DATE OPENED",1,4) = \'2014\' THEN 1 ELSE 0 END) AS "2014_PERMITS", SUM(CASE WHEN SUBSTRING("DATE OPENED",1,4) = \'2013\' THEN 1 ELSE 0 END) AS "2013_PERMITS" FROM "94701a46-ee4a-4f42-8bea-b80ce10041a8" WHERE "RECORD MODULE" = \'Building\' GROUP BY "MONTH" ORDER BY "MONTH" ASC';

var leadText = "In 2014, %name% issued %amount%% more building permits than in 2013.";

// Make API call.
function requestJSON(sql, callback) {
  $.ajax({
    url: urlBase + sql,
    complete: function(xhr) {
      $("h2").show();
      callback.call(null, xhr.responseJSON);
    }
  });
}

// Get Yearly totals.
function getYearlyTotals() {

  requestJSON(sqlYearlyString, function(json) {
    var _2013 = json.result.records[0]["2013_PERMITS"];
    var _2014 = json.result.records[0]["2014_PERMITS"];
    var change = Math.round(((_2014 - _2013)/_2013)*100);
    $(".lead").text(leadText.replace('%amount%', change).replace('%name%', city));
    var chart = c3.generate({
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

// Get monthly totals.
function getMonthlyTotals() {

  requestJSON(sqlMonthlyString, function(json) {
    var _2013 = ['2013'];
    var _2014 = ['2014'];
    for(var i=0; i<json.result.records.length; i++) {
      _2013.push(json.result.records[i]["2013_PERMITS"]);
      _2014.push(json.result.records[i]["2014_PERMITS"]);
    }
    var chart = c3.generate({
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
            },
      bar: {
          width: {
              ratio: 0.5
          }
      }
  });

  });
}
