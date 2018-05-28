import { toast } from 'react-toastify'
import { upload } from '../Components/FirebaseProvider' 

export const uploadFileWithToaster = (path='/images',image) => {

  if(!image){
    return Promise.resolve()
  }

  const toastId = toast(`⏳ uploading ${image.name} 0%`, { type: toast.TYPE.INFO, autoClose: false });

  const onProgress = ( file, progress ) => toast.update(toastId, { render:`⏳ uploading ${file.name} ${ parseInt(progress*100,10) }%` });
  
  return upload(path,image, {}, onProgress)
    .then( ({ free, image:img, ...image }) => {
      toast.update(toastId, { render:`✓ ${image.name} uploaded!`, autoClose:3000 });
      free && free();
      return image
    })
}

export default uploadFileWithToaster