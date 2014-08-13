(function() {
 
  // Some global variables (database, references to key UI elements)
  var db, input, ul;
 
  databaseOpen(function() {
    input = document.getElementsByTagName('input')[0];
    ul = document.getElementsByTagName('ul')[0];
    document.body.addEventListener('submit', onSubmit);
    document.body.addEventListener('click', onClick);
    databaseTodosGet(renderAllTodos);
  });
 
  function onClick(e) {
 
    // We'll assume any element with an ID attribute
    // is a todo item. Don't try this at home!
    if (e.target.hasAttribute('id')) {
 
      // Note because the id is stored in the DOM, it becomes
      // a string so need to make it an integer again
      databaseTodosDelete(parseInt(e.target.getAttribute('id'), 10), function() {
        databaseTodosGet(renderAllTodos);
      });
    }
  }
 
  function renderAllTodos(todos) {
    var html = '';
    todos.forEach(function(todo) {
      html += todoToHtml(todo);
    });
    ul.innerHTML = html;
  }
 
  function todoToHtml(todo) {
    return '<li id="'+todo.timeStamp+'">'+todo.text+'</li>';
  }

  function onSubmit(e) {
    e.preventDefault();
    databaseTodosAdd(input.value, function() {
    // After new todos have been added - rerender all the todos
    databaseTodosGet(renderAllTodos);
      input.value = '';
    });
  }
 
  function databaseOpen(callback) {
    // Open a database, specify the name and version
    var version = 1;
    var request = indexedDB.open('todos', version);
 
    // Run migrations if necessary
    request.onupgradeneeded = function(e) {
      db = e.target.result;
      e.target.transaction.onerror = databaseError;
      db.createObjectStore('todo', { keyPath: 'timeStamp' });
    };

    request.onsuccess = function(e) {
      db = e.target.result;
      callback();
    };
    request.onerror = databaseError;
  }
 
  function databaseError(e) {
    console.error('An IndexedDB Error has occurred', e);
  }
 
  function databaseTodosAdd(text, callback) {
    var transaction = db.transaction(['todo'], 'readwrite');
    var store = transaction.objectStore('todo');
    var request = store.put({
      text: text,
      timeStamp: Date.now()
    });
 
    request.onsuccess = function(e) {
      callback();
    };
    request.onerror = databaseError;
  }

  function databaseTodosGet(callback) {
    var transaction = db.transaction(['todo'], 'readonly');
    var store = transaction.objectStore('todo');
 
    // Get everything in the store
    var keyRange = IDBKeyRange.lowerBound(0);
    var cursorRequest = store.openCursor(keyRange);
 
    // This fires once per row in the store, so for simplicity
    // collect the data in an array (data) and send it pass it
    // in the callback in one go
    var data = [];
    cursorRequest.onsuccess = function(e) {
      var result = e.target.result;
 
      // If there's data, add it to array
      if (result) {
        data.push(result.value); 
        result.continue();
 
      // Reach the end of the data
      } else {
        callback(data);
      }
    };
  }

  function databaseTodosDelete(id, callback) {
    var transaction = db.transaction(['todo'], 'readwrite');
    var store = transaction.objectStore('todo');
    var request = store.delete(id);
    request.onsuccess = function(e) {
      callback();
    };
    request.onerror = databaseError;
  }
 
}());
