import { create } from 'zustand'
import { Board, Column, Image, Todo, TypedColumn } from '@/typings';
import { getTodosGroupByColumn } from '@/lib/getTodosGroupByColumn';
import {  ID, database, storage } from '@/appwrite';
import uploadImage from '@/lib/uploadImage';


interface BoardState{
    board : Board;
    getBoard: () => void;
    setBoardState: (board: Board) => void;
    updateTodoInDB: (todo: Todo, columnId: TypedColumn) => void;
    newTaskInput: string;
    newTaskType: TypedColumn;
    image: File | null;

    searchString: string;
    setSearchString: (searchString: string) => void;

    addTask: (todo:string, columnId: TypedColumn, image?: File | null) => void;
    deleteTask : (taskIndex: number, todoId: Todo, id: TypedColumn) => void;

    setNewTaskInput: (input : string) => void;
    setNewTaskType: (columnId : TypedColumn) => void;
    
    setImage: (image: File | null) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  board: {
        columns: new Map<TypedColumn, Column>() 
  },
      searchString: " ",
      newTaskInput: " ",
      newTaskType:  "todo",
      image: null,
      setSearchString: (searchString) => set({ searchString}),

  getBoard: async() => {
        const board = await getTodosGroupByColumn()
        set({ board });
  },

  setBoardState: (board) => set({ board}),

  deleteTask: async (taskIndex: number, todo: Todo, id : TypedColumn) => {
       const newColumns = new Map ( get().board.columns);  


       newColumns.get(id)?.todos.splice(taskIndex, 1);

       set({ board : {columns: newColumns}});

       if(todo.image) {
            await storage.deleteFile(todo.image.bucketId, todo.image.fileId);
       }

       await database.deleteDocument(
            process.env.NEXT_PUBLIC_DATABASE_ID!,
            process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
            todo.$id,
       );

  },

  setNewTaskInput: (input :string) => set({ newTaskInput: input}),
  setNewTaskType: (columnId : TypedColumn) => set({ newTaskType: columnId}),
  setImage: (image : File | null) => set({ image }),
  
  updateTodoInDB: async(todo, coloumnId) => {

            await database.updateDocument(
                  process.env.NEXT_PUBLIC_DATABASE_ID!,
                  process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
                  todo.$id,
                  {
                        title: todo.title,
                        status: coloumnId, 
                  }
            )

  },
  addTask: async (todo: string, coloumnId: TypedColumn, image?: File | null) => {
      let file: Image | undefined;
      
      if(image){
            const fileUploaded = await uploadImage(image);
            if(fileUploaded) {
                  file = {
                        bucketId : fileUploaded.bucketId,
                        fileId: fileUploaded.$id,
                  };
            }
      }
      const{ $id }=await database.createDocument(
            process.env.NEXT_PUBLIC_DATABASE_ID!,
            process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
            ID.unique(), 
            {
                  title: todo,
                  status: coloumnId,

                  ...(file && { image : JSON.stringify(file) }),
            }
      );

      set({newTaskInput : ""});

      set((state) => {
            const newColumns = new Map(state.board.columns);

            const newTodo : Todo = {
                  $id,
                  $createdAt : new Date().toISOString(),
                  title: todo,
                  status : coloumnId,

                  ...(file && { image : file}),
            };

            const column = newColumns.get(coloumnId);

            if(!column){

                  newColumns.set(coloumnId,{
                        id : coloumnId,
                        todos :[newTodo]
                  });
            } else {
                  newColumns.get(coloumnId)?.todos.push(newTodo);
            }

            return {
                  board: {
                        columns: newColumns,
                  }
            }
      })
      
  }

}));