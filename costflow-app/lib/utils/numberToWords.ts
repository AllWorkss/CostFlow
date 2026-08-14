// Convert numerical currency amounts to formal English text words
export function numberToWords(num: number, currency: "INR" | "USD" = "INR"): string {
  if (isNaN(num) || num <= 0) return "Zero Rupees Only";

  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty ", "Thirty ", "Forty ", "Fifty ", "Sixty ", "Seventy ", "Eighty ", "Ninety "];

  const inWords = (n: number): string => {
    const nStr = n.toString();
    if (nStr.length > 9) return nStr;
    const nArr = ("000000000" + nStr).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!nArr) return "";
    let str = "";
    str += Number(nArr[1]) !== 0 ? (a[Number(nArr[1])] || b[parseInt(nArr[1][0])] + a[parseInt(nArr[1][1])]) + "Crore " : "";
    str += Number(nArr[2]) !== 0 ? (a[Number(nArr[2])] || b[parseInt(nArr[2][0])] + a[parseInt(nArr[2][1])]) + "Lakh " : "";
    str += Number(nArr[3]) !== 0 ? (a[Number(nArr[3])] || b[parseInt(nArr[3][0])] + a[parseInt(nArr[3][1])]) + "Thousand " : "";
    str += Number(nArr[4]) !== 0 ? (a[Number(nArr[4])] || b[parseInt(nArr[4][0])] + a[parseInt(nArr[4][1])]) + "Hundred " : "";
    str += Number(nArr[5]) !== 0 ? (str !== "" ? "and " : "") + (a[Number(nArr[5])] || b[parseInt(nArr[5][0])] + a[parseInt(nArr[5][1])]) : "";
    return str;
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  const currencyUnit = currency === "INR" ? "Rupees" : "Dollars";
  const subUnit = currency === "INR" ? "Paise" : "Cents";

  let words = inWords(integerPart).trim() + " " + currencyUnit;

  if (decimalPart > 0) {
    words += " and " + inWords(decimalPart).trim() + " " + subUnit;
  }

  return words + " Only";
}
