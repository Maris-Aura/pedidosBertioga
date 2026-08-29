function emv(id: string, value: string) {
  const length = value.length.toString().padStart(2, "0");
  return `${id}${length}${value}`;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixCopyPaste(params: {
  pixKey: string;
  merchantName: string;
  amount: number;
  city?: string;
  txid?: string;
}) {
  const merchantName = params.merchantName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .slice(0, 25)
    .toUpperCase();
  const city = (params.city ?? "BERTIOGA")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .slice(0, 15)
    .toUpperCase();
  const amount = params.amount.toFixed(2);
  const txid = (params.txid ?? "***").slice(0, 25);

  const merchantAccount = emv("00", "BR.GOV.BCB.PIX") + emv("01", params.pixKey);
  const additionalData = emv("05", txid);

  const payload =
    emv("00", "01") +
    emv("26", merchantAccount) +
    emv("52", "0000") +
    emv("53", "986") +
    emv("54", amount) +
    emv("58", "BR") +
    emv("59", merchantName) +
    emv("60", city) +
    emv("62", additionalData) +
    "6304";

  return payload + crc16(payload);
}
