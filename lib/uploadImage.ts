import {ID, storage} from "@/appwrite";

const uploadImage = async(file:File) => {
        if(!file) return;

        const fileUploaded = await storage.createFile(
            "6471023f3394693a90d4",
            ID.unique(),
            file
        );
        return fileUploaded;
};

export default uploadImage;