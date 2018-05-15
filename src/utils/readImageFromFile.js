window.URL = window.URL || window.webkitURL;

export const readImageFromFile = (file) => new Promise(( resolve, reject )=>{
  
  if(!file) { return reject(new Error('no file provided'))}

  const extension = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();
  if(!(extension === "gif" || extension === "png" || extension === "jpeg" || extension === "jpg")){
    return resolve({ file, extension })
  }

  const image = new Image();
  
  image.onload = () => {
      const { naturalHeight:height, naturalWidth:width } = image
      const free = () => window.URL.revokeObjectURL( image.src );
      const orientation = width > height ? 'landscape' : height > width ? 'portrait' : 'square'
      const ratioWidth = height/width
      const ratioHeight = width/height
      return resolve({ file, image, width, height, url:image.src, ratioWidth, ratioHeight, orientation, extension, free })
  };

  image.onerror = (evt) => {
    console.log(evt)
    reject(new Error('could not load file'))
  }
    
  image.src = window.URL.createObjectURL(file);
})