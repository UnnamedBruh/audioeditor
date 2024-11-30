const ridiculous = [];
for (let i = 0; i < 200; i++) {
    ridiculous.push(Math.sin(i / (100 / Math.PI)));
}
const data = ridiculous.map(x => Math.round((x + 1) * 50));
for (let i = 0; i < data.length; i += 2) {
    data.splice(i + 1, 0, i / 2);
};
let data2 = 'M 0,50 ';
for (let i = 0; i < data.length; i += 2) {
    data2 = data2 + "L " + data[i + 1] + "," + data[i] + " ";
}
data2.trim()
