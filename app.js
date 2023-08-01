const express = require("express");
const {open} = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const databasePath = path.join(__dirname,"todoApplication.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
    try {
        db = await open({
        filename: databasePath,
        driver: sqlite3.Database
        })
        app.listen(3000,() => 
            console.log("Server Running at http://localhost:3000/")
        );
    }
    catch (e) {
        console.log(`DB Error: ${e.message}`);
        process.exit(1);
    }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
    return (requestQuery.priority !== undefined && requestQuery.status !== undefined);
};

const hasPriorityProperty = (requestQuery) => {
    return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
 return requestQuery.status !== undefined;
};

//Get Todo Priority, Status API
app.get("/todos/", async (request, response) => {
    const {search_q = "", priority, status} = request.query;
    switch (true) {
        case hasPriorityAndStatusProperties(request.query):
            getTodosQuery = `
            SELECT
              *
            FROM
              todo
            WHERE
              todo LIKE '%${search_q}%'
              AND status = '${status}'
              AND priority = '${priority}';`;
            break;
        case hasPriorityProperty(request.query):
            getTodosQuery = `
            SELECT
              * 
            FROM
              todo
            WHERE
              todo LIKE '%${search_q}%'
              AND priority = '${priority}';`;
            break;
        case hasStatusProperty(request.query):
            getTodosQuery = `
            SELECT
              *
            FROM
              todo 
            WHERE
              todo LIKE '%${search_q}%'
              AND status = '${status}';`;
            break;
        default:
            getTodosQuery = `
            SELECT
              *
            FROM
              todo
            WHERE
              todo LIKE '%${search_q}%';`;
    }
    const todosArray = await db.all(getTodosQuery);
    response.send(todosArray);
});

//Get Todo API
app.get("/todos/:todoId/", async (request, response) => {
    const {todoId} = request.params;
    const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
    const todoDetails = await db.get(getTodoQuery);
    response.send(todoDetails);
});

//Add Todo API
app.post("/todos/", async (request, response) => {
    const {id, todo, priority, status} = request.body;
    const postTodoQuery = `
    INSERT INTO
      todo(id, todo, priority, status)
    VALUES
      (${id}, '${todo}', '${priority}', '${status}');`;
    await db.run(postTodoQuery);
    response.send("Todo Successfully Added");
});

//Update Todo API
app.put("/todos/:todoId/", async (request, response) => {
    const {todoId} = request.params;
    const requestBody = request.body;
    let updateColumn = null;
    switch (true) {
        case requestBody.status !== undefined:
            updateColumn = "Status";
            break;
        case requestBody.priority !== undefined:
            updateColumn = "Priority";
            break;
        case requestBody.todo !== undefined:
            updateColumn = "Todo";
            break;
    }

    const previousTodoQuery = `
    SELECT
      *
    FROM 
      todo
    WHERE
      id ='${todoId}';`;
      
    const previousTodoDetails = await db.get(previousTodoQuery);

    const {
        todo = previousTodoDetails.todo,
        priority = previousTodoDetails.priority,
        status = previousTodoDetails.status
    } = request.body;

    const updateTodoQuery = `
    UPDATE
      todo
    SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}'
    WHERE
      id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
});

//Delete Todo API
app.delete("/todos/:todoId/", async (request, response) => {
    const {todoId} = request.params;
    const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`;
    await db.run(deleteTodoQuery);
    response.send("Todo Deleted");
});

module.exports = app;
