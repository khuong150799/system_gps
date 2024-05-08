const moment = require("moment");

const getTime = {
  currDate: function () {
    return moment(new Date()).format("YYYY-MM-DD");
  },
  currTime: function () {
    return moment(new Date()).format("HH:mm:ss");
  },
  current: function () {
    return moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
  },
  currenUnix: function () {
    const strDate = new Date();

    return Math.floor(strDate.getTime() / 1000);
  },
  startDateUnix: function () {
    const strDate = new Date(`${this.currDate()} 00:00:00`);

    return Math.floor(strDate.getTime() / 1000);
  },
  endDate: function () {
    return moment(new Date()).format("YYYY-MM-DD 23:59:59");
  },
  endDateUnix: function () {
    const strDate = new Date(`${this.currDate()} 23:59:59`);

    return Math.floor(strDate.getTime() / 1000);
  },
  currentM: function () {
    return moment(new Date()).format("YYYY-MM-DD HH:mm");
  },
  date: function (date) {
    return moment(date).format("YYYY-MM-DD");
  },
  time: function (date) {
    return moment(date).format("HH:mm:ss");
  },
  timeHm: function (date) {
    return moment(date).format("HH:mm");
  },
  Unix2String: function (value) {
    return moment.unix(value).format("YYYY-MM-DD HH:mm:ss");
  },
  Unix2StringFormat: function (value) {
    return moment.unix(value).format("HH:mm:ss DD/MM/YYYY");
  },
  format: function (date, type = { time: "HH:mm:ss", date: "DD/MM/YYYY" }) {
    const isValidDate = moment(date, true).isValid();

    return isValidDate
      ? moment(date).format(`${type.time} ${type.date}`)
      : date;
  },
  formatDate: function (date) {
    return moment(date).format("DD/MM/YYYY");
  },
  formatTime: function (date) {
    return moment(date).format("HH:mm:ss");
  },

  String2Unit: function (value) {
    const date = new Date(value);
    return Math.floor(date.getTime() / 1000);
  },
  caculateTime: function (totalseconds) {
    const day = 86400;
    const hour = 3600;
    const minute = 60;

    const daysout = Math.floor(totalseconds / day);
    const hoursout = Math.floor((totalseconds - daysout * day) / hour);
    const minutesout = Math.floor(
      (totalseconds - daysout * day - hoursout * hour) / minute
    );
    const secondsout =
      totalseconds - daysout * day - hoursout * hour - minutesout * minute;

    const dayString = daysout ? `${daysout} ngày` : "";
    const hourString = hoursout ? `${hoursout} giờ` : "";
    const minuteString = minutesout ? `${minutesout} phút` : "";
    const secondString = secondsout ? `${secondsout} giây` : "";

    return `${dayString} ${hourString} ${minuteString} ${secondString}`;
  },
};

module.exports = getTime;
