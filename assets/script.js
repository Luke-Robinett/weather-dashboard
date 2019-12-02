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
  var iconSrc = "http://openweathermap.org/img/wn/" + response.weather[0].icon + ".png";
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
   // Store needed data from response
   var day = moment(response.list[i].dt_txt).format("ddd");
   var temp = Math.round(response.list[i].main.temp);
   var humidity = response.list[i].main.humidity;
   var desc = response.list[i].weather[0].description;
   var iconSrc = "http://openweathermap.org/img/wn/" + response.list[i].weather[0].icon + ".png";

   // Create a new card
   var newCard = $("<div>").addClass("card w-50");

   var cardImg = $("<img>").addClass("card-img-top");
   cardImg.attr("src", iconSrc);
   cardImg.attr("alt", desc);
   newCard.append(cardImg);

   var cardBody = $("<div>").addClass("card-body");

   var cardTitle = $("<h5>").addClass("card-title text-center");
   cardTitle.text(day);
   cardBody.append(cardTitle);

   var cardSubTitle = $("<h6>").addClass("card-subtitle text-center");
   cardSubTitle.text(temp + " F");
   cardBody.append(cardSubTitle);

   var cardText = $("<p>").addClass("card-text text-center");
   cardText.text("H " + humidity + "%");
   cardBody.append(cardText);

   newCard.append(cardBody);

   $("#forecast").append(newCard);
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
