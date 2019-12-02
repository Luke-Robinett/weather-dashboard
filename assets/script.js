// Store the Open Weather API key globally so all JS functions can access it
var appId = "660a3e65013c2dd5b7143e9563922a43";

// Main program
$(document).ready(function () {
 // Display today's date
 $("#main-date").text(moment().format("dddd, MMMM Do"));

 // Load search history
 displaySearchHistory();

 // Search button event handler
 $("#search-button").click(function (event) {
  event.preventDefault();

  var city = $("#search-field").val().trim();
  if (city.length > 0) {
   saveToSearchHistory(city);
   displayCurrentWeather(city);
   $("#search-field").val("");
   displaySearchHistory();
  } else {
   alert("Search field cannot be blank.");
  }
 });

 // Current Location button event handler
 $("#current").click(function (event) {
  navigator.geolocation.getCurrentPosition(function (position) {
   $.ajax({
    url: "https://api.openweathermap.org/data/2.5/find?lat=" + position.coords.latitude + "&lon=" + position.coords.longitude + "&cnt=1&APPID=" + appId,
    method: "GET"
   }).then(function (response) {
    if (response.count > 0) {
     displayCurrentWeather(response.list[0].name);
    } else {
     alert("Location info not available.");
    }
   });
  });
 });

 // Search history dropdown event handler
 $("#history").on("change", function (event) {
  event.preventDefault();

  if ($(this).prop("selectedIndex") > 0) {
   displayCurrentWeather($(this).val());
  }
 });

 // Clear history button event handler
 $("#clear-history").click(function (event) {
  event.preventDefault();

  Lockr.set("searchHistory", null);
  displaySearchHistory();
 });
});

function displayCurrentWeather(city) {
 $.ajax({
  url: "https://api.openweathermap.org/data/2.5/weather?APPID=" + appId + "&q=" + city + "&units=imperial",
  method: "GET",
  error: function () {
   alert("Nothing found.");
  }
 }).then(function (response) {
  $("#welcome").addClass("d-none");
  $("#weather").removeClass("d-none");

  $("#city").text(response.name);
  var iconSrc = "https://openweathermap.org/img/wn/" + response.weather[0].icon + "@2x.png";
  $("#main-icon").attr("src", iconSrc);
  $("#main-icon").attr("alt", response.weather[0].description);
  $("#main-temp").text(Math.round(response.main.temp) + " F");
  $("#main-humidity").text(response.main.humidity + "%");
  $("#main-windspeed").text(Math.round(response.wind.speed) + " mph");
  displayUvIndex(response.coord.lat, response.coord.lon);

  displayExtendedForecast(response.id);
 });
}

function displayUvIndex(lat, lon) {
 $.ajax({
  url: "https://api.openweathermap.org/data/2.5/uvi?appid=" + appId + "&lat=" + lat + "&lon=" + lon,
  method: "GET"
 }).then(function (response) {
  $("#main-uv").text(response.value);
 });
}

function displayExtendedForecast(id) {
 $.ajax({
  url: "https://api.openweathermap.org/data/2.5/forecast?id=" + id + "&units=imperial&APPID=" + appId,
  method: "GET"
 }).then(function (response) {
  // Clear div that will display 5-day forecast
  $("forecast").empty();

  // Set up loop to get temp at 12 PM of each of the 5 days since results are in 3-hour segments
  for (var i = 5; i < response.list.length; i += 8) {
   // Store needed data from response
   var day = moment(response.list[i].dt_txt).format("ddd");
   var temp = Math.round(response.list[i].main.temp);
   var humidity = response.list[i].main.humidity;
   var desc = response.list[i].weather[0].description;
   var iconSrc = "https://openweathermap.org/img/wn/" + response.list[i].weather[0].icon + "@2x.png";

   // Create a new col div
   var newCol = $("<div>").addClass("col-4 col-sm-2 text-center justify-content-center");

   var dayHeading = $("<h3>").text(day).addClass("text-center");
   newCol.append(dayHeading);

   var img = $("<img>");
   img.attr("src", iconSrc);
   img.attr("alt", desc);
   newCol.append(img);

   var tempHeading = $("<h2>").text(temp + " F").addClass("text-center");
   newCol.append(tempHeading);

   var humidityP = $("<p>").text("H " + humidity).addClass("text-center");
   newCol.append(humidityP);

   $("#forecast").append(newCol);
  }
 });
}

function displaySearchHistory() {
 var searchHistory = Lockr.get("searchHistory");
 var historyDropDown = $("#history");
 historyDropDown.empty();
 if (searchHistory != null) {
  for (var i = 0; i < searchHistory.length; i++) {
   var searchOption = $("<option>").text(searchHistory[i]);
   historyDropDown.prepend(searchOption);
  }
  historyDropDown.prepend($("<option>").text("Select..."));
 } else {
  historyDropDown.append($("<option>").text("No search history yet"));
 }
 historyDropDown.prop("selectedIndex", 0);
}

function saveToSearchHistory(city) {
 var searchHistory = Lockr.get("searchHistory");
 city = city.toLowerCase();

 if (searchHistory != null) {
  if (!searchHistory.includes(city)) {
   searchHistory.push(city);
  }
 } else {
  searchHistory = [city];
 }
 Lockr.set("searchHistory", searchHistory);
}
