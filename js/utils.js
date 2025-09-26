export function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg; t.hidden = false;
  setTimeout(()=> t.hidden = true, 1500);
}
export function downloadJSON(obj, filename="config.json"){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:"application/json"}));
  a.download = filename; a.click();
}