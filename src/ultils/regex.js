exports.regexNumber = /^[0-9]+$/;
// exports.regexPhone = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
exports.regexPhone = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
exports.regexPhoneNotZero = /([3|5|7|8|9])+([0-9]{8})\b/g;

exports.regexAccount = (username) => {
  const regexAccount = /^[a-z0-9]+$/;
  return regexAccount.test(username) ? true : false;
};
exports.regexPass = (password) => {
  const regexPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return regexPass.test(password) ? true : false;
};
exports.regexImei = /^[a-zA-Z0-9]{10}$/;

exports.regexPhoneNumber = (phone) => {
  const regexPhoneNumber = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;

  return phone.match(regexPhoneNumber) ? true : false;
};

exports.regexEmail = (email) => {
  const regexEmail =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  return regexEmail.test(email) ? true : false;
};
