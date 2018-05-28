import { toast } from 'react-toastify'
import { removeFile } from '../Components/FirebaseProvider' 

export const deleteFileWithToaster = (image) => {
  if(!image){
    return Promise.resolve()
  }
  const id = image.id

  const toastId = toast(`⏳ deleting ${image.name}`, { type: toast.TYPE.INFO, autoClose: false });

  return removeFile(id)
    .catch(e=>{
      toast.update(toastId, { render:`❌ error deleting {file.name}`,type:'error', autoClose:3000})
      return true
    })
    .then((isError)=>{
      !isError && toast.update(toastId, { render:`✓ ${image.name} deleted`, autoClose:3000})
    })
}

export default deleteFileWithToaster