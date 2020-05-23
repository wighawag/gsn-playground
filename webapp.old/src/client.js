// TEMPLATE from sapper

import * as sapper from "@sapper/app";

sapper.start({
  target: document.querySelector("#sapper")
});


// TODO remove
window.errorToAscii = function(str1) {
	const l = 64 + 64 + 10;
	if (str1.length <= l) {
		return "UNKNOWN ERROR (could be an OUT OF GAS error, check txGas value)";
	}
	str1 = str1.slice(l);
	let str = '';
	for (let n = 0; n < str1.length; n += 2) {
		str += String.fromCharCode(parseInt(str1.substr(n, 2), 16));
  }
	return str;
}

console.log("///////////////////////////////////");
console.log(
  window.errorToAscii("f8ca2b843b9aca0082bd69943037e0b21e7b8e0babaf3611d6d0d5cac51e67c080b864c47f0027000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000046678666600000000000000000000000000000000000000000000000000000000820a96a099a88ca330bfd04a3061c64eb56a579c8b0522528e224afe22f6acd07a29944ea0422a181f542b391f550e737a845a89d4ea332a1deb7bff5cf7a84c7ebecc1644")
);
console.log("///////////////////////////////////");
