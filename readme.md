# Node Number Factory
> Backend Programming Challenge

# Synopsis
I approached this challenge with the mindset that this should be a "production like" app designed
to support hundreds of simultaneous users. While this backend could have been written simply with
less code, my goal was to produce an app that would be maintainable, flexible, and performant.

## Technologies
**Node.js/Express/Socket.io**    
The challenge called for persisting state across multiple sessions—which means emitting events.
So, Socket.io and Node's event driven model seemed like a natural fit for the project.

**MongoDB**    
Since the data we're storing isn't relational in nature, a NoSQL database was a convenient choice.
I chose to store the nodes in a single collection and generate relationships by keeping track of each
node's parent.

## Considerations
*What if the database requirements changed suddenly?*    
I implemented a "store" interface that requires 5 methods. With this design,
if and when the next greatest database hits the market, creating a new store driver would
be quick and easy.

*What if a new requirement requires the "number" (leaf) nodes to have children?*    
I wanted to design the project so that *any* node can have children. So, all tree generation is
recursive. Accounting for only "root", "factory", and "number" nodes without thinking about the
future would mean major refactoring down the road.

*What if we wanted to allow users to insert a 1,000 or more number nodes... not just 15?*    
Given the tree structure and how expensive database calls are, inserting a large number of nodes
would kill performance. *Enter cache...*

With caching, I was able to drop the time to insert 1,000 nodes from about 5 seconds to 1 (due
to the fact that we have to sanitize a node before we update it, which means fetching the missing
data before upsertion).

Additionally, when the tree comes back from the server on the first payload, all nodes are
immediately cached. Hundreds of users can connect and only a one-time set of O(n) calls are made
to the database (for initialization). This means simultaneous connections won't flood the database. 

From the frontend, I was able to insert over 5,000 nodes in about 4 seconds (locally).

# Project Structure
```js
.
|-- src
    |-- stores          // Houses all of the various database store drivers.
    |-- constants.js    // Constant values used throughout the app.
    |-- events.js       // The logic for all socket event handling.
    |-- index.js        // Main entry point into the app.
    |-- NodeFactory.js  // Wrapper logic that ties together the store and cache,
                        // and validates and preprocesses nodes for addition/deletion.
    |-- websockets.js   // Sets up and exports the socket.io server
```

## Program Flow
- The user passes an `http.Server`, cache, and store instances to the default export.    
  Defaults are provided for the cache and store if none are supplied.
- A `NodeFactory` instance is created using the given cache and store, creating functions
  bound to the cache and store.
  This instance will perform all of the tree node CRUD operations.
- This is passed to the `events.js` export, which creates a function that uses
  the provided `NodeFactory` instance in response to socket events.
- This function is passed to `websockets.js` which invokes it with the socket.io instance.
- The user can then start their http server.

## Interfaces

### Stores
**A store must implement the following methods:**
- getAllNodes
- getNodeWithId
- deleteNodes
- upsertNodes
- getChildrenOfNodeWithId

### Caches
**A cache must implement the following methods:**
- get
- set
- del

Stores and caches are *dumb*. Their only concerns are storing and deleting data. All logic
resides in `NodeFactory.js`.