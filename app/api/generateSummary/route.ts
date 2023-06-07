import openApi from "@/openai";
import { NextResponse } from "next/server";

export async function POST(request: Request){

    const { todos } = await request.json();
    
    
    const response = await openApi.createChatCompletion({
        model:  "gpt-3.5-turbo",
        temperature: 0.8,
        n: 1,
        stream: false,
        messages: [

            {
                role: "system",
                content: `When responding, welcome the user always in Mr. Prince Roy's application and welcome to the Prince's world!
                Limit your response to 200 characters`,
            },
            {
                role: "user",
                content: `Hi there, provide a summary of the following todos. Count how many todos are in each category such as TO do, In Progress and done,
                then tell the user to have a productive day! Here's the data: ${JSON.stringify(todos)}`,
            },
        ],


    });

    const { data } = response;



    return NextResponse.json(data.choices[0].message);
}