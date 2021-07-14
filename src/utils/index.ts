export function showImageInConsole(url: any, size = 100) {
  const image = new Image();
  image.onload = function () {
    const style = [
      'font-size: 1px;',
      'padding: ' + (this.height / 100) * size + 'px ' + (this.width / 100) * size + 'px;',
      'background: url(' + url + ') no-repeat;',
      'background-size: contain;',
    ].join(' ');
    console.log('%c ', style);
  };
  image.src = url;
}
