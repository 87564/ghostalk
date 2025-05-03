function createRoom() {
  const roomId = Math.random().toString(36).substring(2, 8);
  const url = `${window.location.origin}/call.html?room=${roomId}`;
  const linkElement = document.getElementById('link');
  linkElement.href = url;
  linkElement.innerText = url;
}
