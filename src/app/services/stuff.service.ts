import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.reducer';
import { map } from 'rxjs/operators';
import { Miembro } from '../interfaces/miembro.interface';
import { Observable } from 'rxjs';
import { activateLoading, loadUpdateMiembroSuccess } from '../store/actions';

@Injectable({
  providedIn: 'root'
})
export class StuffService {

  private stuffColl: AngularFirestoreCollection;
  public imageURL;
  public maleGenericImagePic = 'https://firebasestorage.googleapis.com/v0/b/consultorio-ayacucho.appspot.com/o/standarPics%2FMale_Doctor.png?alt=media&token=b3d083d0-4201-4f92-9f3c-a0011b8c787b';
  public femaleGenericImagePic = 'https://firebasestorage.googleapis.com/v0/b/consultorio-ayacucho.appspot.com/o/standarPics%2FFemale_Doctor.png?alt=media&token=daefb604-2231-4f35-be60-c60afeca0369';

  constructor(private afs:AngularFirestore, 
              private storage:AngularFireStorage, 
              private store:Store<AppState>) {
                this.stuffColl = this.afs.collection<Miembro>('stuff');
               }

  getStuff(): Observable<Miembro[]> { 
    this.store.dispatch( activateLoading() )
    return this.stuffColl.snapshotChanges().pipe(map(action => action.map(snap => {
      const miembro = snap.payload.doc.data() as Miembro;
      miembro.id = snap.payload.doc.id;
      return miembro
    })))
  }

  addMiembro(miembro:Miembro, image?:File):string { 
    this.stuffColl.add(miembro).then((docRef) => {
      this.stuffColl.doc(docRef.id).update({
        id:docRef.id
      }).then(() => {
        if(image){
          this.uploadMiembroImage(docRef.id, image);
        }else{
          this.imageURL = null;
          if(miembro.genero == 'Masculino'){
            this.stuffColl.doc(docRef.id).update({
              photoURL: this.maleGenericImagePic
            })
          }else{
            this.stuffColl.doc(docRef.id).update({
              photoURL: this.femaleGenericImagePic
            })
          }
        }
      })
    })
    if(this.imageURL) { 
      return this.imageURL
    }else if(miembro.genero == 'Masculino') {
      this.store.dispatch(loadUpdateMiembroSuccess({miembro: miembro, image: this.maleGenericImagePic}));
    }else{
      this.store.dispatch(loadUpdateMiembroSuccess({miembro: miembro, image: this.femaleGenericImagePic}));
    }
  }

  getMiembro(id:string) { 
   return this.stuffColl.doc(id).valueChanges()
  }

  updateMiembro(miembro:Miembro, image:File): string { 
     this.stuffColl.doc(miembro.id).update(miembro).then(() => {
      if(image) { 
        this.uploadMiembroImage(miembro.id, image);
      }
    })
    if(image) { 
      return this.imageURL;
    }
  }

  async deleteMiembro(id:string) {
    await this.stuffColl.doc(id).delete();
  }


  uploadMiembroImage(id:string, image:File) { 
    this.storage.upload(`stuffPics/${id}`, image).then(() => {
      this.storage.ref(`stuffPics/${id}`).getDownloadURL().subscribe((imageURL:string) =>{
        this.imageURL = imageURL;
        this.stuffColl.doc(id).update({
          photoURL: this.imageURL
        })
      })
    })
  }

}
