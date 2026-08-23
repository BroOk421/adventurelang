// =========================
// CALENDAR UI (itaas-kanan: araw/gabi, petsa, oras)
// =========================
//
// Simpleng text/icon lang ito - hindi kailangang mag-update kada
// frame (60x kada segundo), kaya interval na lang kada segundo,
// katulad ng ginagawa ng hotbar sa mga button click - event-driven o
// paisa-isang segundo, hindi bahagi ng draw() loop.

// 24-hour format (00:00 hanggang 23:59) - buong ikot nito ay 30 minuto
// lang (tingnan ang DAY_NIGHT_SECONDS sa atmosphere.js).
function formatClockTime(hour24, minute) {
  const hourText = String(hour24).padStart(2, "0");
  const minuteText = String(minute).padStart(2, "0");

  return hourText + ":" + minuteText;
}

function syncCalendarUI() {
  const calendar = getCalendarState();

  const iconEl = document.getElementById("calendar-icon");
  const dateEl = document.getElementById("calendar-date");
  const timeEl = document.getElementById("calendar-time");
  const weatherEl = document.getElementById("calendar-weather-icon");

  if (iconEl) iconEl.textContent = calendar.isDaytime ? "☀️" : "🌙";

  if (dateEl) {
    dateEl.textContent =
      calendar.monthName + " " + calendar.dayOfMonth + ", " + calendar.year;
  }

  if (timeEl) {
    timeEl.textContent = formatClockTime(calendar.hour24, calendar.minute);
  }

  if (weatherEl) {
    let weatherIcon = "";

    if (calendar.isSnowDay) {
      weatherIcon = calendar.isSnowStorm ? "🌨️" : "❄️";
    } else if (calendar.isRainDay) {
      weatherIcon = calendar.isThunderstorm ? "⛈️" : "🌧️";
    }

    weatherEl.textContent = weatherIcon;
    weatherEl.classList.toggle("hidden", weatherIcon === "");
  }
}

syncCalendarUI();
setInterval(syncCalendarUI, 1000);
