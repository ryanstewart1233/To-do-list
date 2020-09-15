
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")

const date = require(__dirname + "/date.js");



const app = express();

app.set('view engine', 'ejs'); //this and the views folder is what makes this work!

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"))


mongoose.connect("mongodb+srv://<user-name>:<password>@cluster0.awzgy.mongodb.net/todolist?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const itemsSchema = {
  name: String
};
const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your new ToDo List!"
});
const item2 = new Item({
  name: "Click the + icon to add a new item"
});
const item3 = new Item({
  name: "Click the trash to delete"
});

const defaultItems = [item1, item2, item3];

let firstItemsAdded = false

app.get("/", function(req, res) {
  let day = date.getDate();

  Item.find({}, function(err, results) {
    // console.log(results);
    if (firstItemsAdded === false && results.length === 0) {
      firstItemsAdded = true
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successful added default items");
        }
      })
      res.redirect("/")
    } else {
      res.render('list', { //renders "/" list
        listTitle: day,
        newListItems: results
      })
    }
  })
})


app.get("/:customListID", function(req, res) {
  const customListID = _.capitalize(req.params.customListID);
  // console.log(req.params.customListID);
  if (customListID === 'Favicon.ico') { //fixes error with getting /Favicon.ico databased made
    res.redirect("/")
  } else {
  List.findOne({
    name: customListID
  }, function(err, result) {
    if (!err) {
      if (!result) { //create new list
        // console.log("Doesn't exist")
        const newlist = new List({
          name: customListID,
          items: defaultItems
        });
        newlist.save() // saves new list
        setTimeout(function (){ //timeout required to prevent duplicates
          res.redirect("/" + customListID)
        }, 500)
      } else {//show existing list
        // console.log("Exists")

        res.render("list", { //renders custom list
          listTitle: result.name,
          newListItems: result.items
        })

      }
    }


  }) }
})


app.post("/", function(req, res) {
  // console.log(req.body.list);
  const listName = req.body.list
  const item = new Item({
    name: req.body.listItem
  });

  let day = date.getDate();
  if (req.body.list === day) {
    item.save();
    res.redirect("/")
  } else {
    List.findOne({
      name: listName
    }, function(err, result) {
      result.items.push(item)
      result.save();
      res.redirect("/" + listName)
    })

  }


})

app.post("/delete", function(req, res) {
  const itemToDelete = req.body.toDelete
  const listName = req.body.listName
  // console.log(req.body.listName);

  let day = date.getDate();

  if (listName === day) {
    Item.deleteOne({
      _id: itemToDelete
    }, function(err) {
      if (err) {
        console.log(err)
      } else {
        console.log("Item succesfully deleted");
        res.redirect("/")
      }
    })
  } else {
    List.findOneAndUpdate({
        name: listName
      }, {
        $pull: {
          items: {
            _id: itemToDelete
          }
        }
      },
      function(err) {
        if (!err) {
          res.redirect("/"+listName)
        } else {
          console.log(err);
        }
      })

  }

})


app.listen(3000, function() {
  console.log("server running on port 3000")
})
