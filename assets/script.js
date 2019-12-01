// Store the Open Weather API key globally so all JS functions can access it
var appId = "66a22b3ac35b14a53d37aa2c7d5ab149";

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

 // Search history links event handler
 $(".history-link").click(function (event) {
  event.preventDefault();

  displayCurrentWeather($(this).text());
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
  var iconSrc = "http://openweathermap.org/img/wn/" + response.weather[0].icon + "@2x.png";
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
  url: "http://api.openweathermap.org/data/2.5/uvi?appid=" + appId + "&lat=" + lat + "&lon=" + lon,
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
  // Clear card deck that will display 5-day forecast
  $(".card-deck").empty();

  // Set up loop to get temp at 12 PM of each of the 5 days since results are in 3-hour segments
  for (var i = 5; i < response.list.length; i += 8) {
   var day = moment(response.list[i].dt_txt).format("dddd, MMMM Do");
   var temp = Math.round(response.list[i].main.temp);
   var humidity = response.list[i].main.humidity;
   var desc = response.list[i].weather[0].description;
   var iconSrc = "http://openweathermap.org/img/wn/" + response.list[i].weather[0].icon + ".png";

   // Create a new card
   var newCard = $("<div>").addClass("card card-5day");

   var cardImg = $("<img>").addClass("card-img-top");
   cardImg.attr("src", iconSrc);
   cardImg.attr("alt", desc);
   newCard.append(cardImg);

   var cardBody = $("<div>").addClass("card-body");

   var cardTitle = $("<h5>").addClass("card-title text-center");
   cardTitle.text(temp + " F");
   cardBody.append(cardTitle);

   var cardSubTitle = $("<h6>").addClass("card-subtitle text-center");
   cardSubTitle.text("Hum: " + humidity + "%");
   cardBody.append(cardSubTitle);

   newCard.append(cardBody);

   var col = $("<div>").addClass("col");
   col.append(newCard);

   $("#forecast").append(col);
  }
  console.log(response);
 });
}

function displaySearchHistory() {
 var searchHistory = Lockr.get("searchHistory");
 if (searchHistory != null) {
  $("#search-history").empty();
  for (var i = 0; i < searchHistory.length; i++) {
   var historyItem = $("<li>").addClass("list-group-item");
   var historyLink = $("<a>").addClass("history-link");
   historyLink.text(searchHistory[i]);
   historyLink.attr("href", "");
   historyItem.append(historyLink);
   $("#search-history").prepend(historyItem);
  }
 } else {
  $("#search-history").append("<strong>").text("No search history");
 }
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
