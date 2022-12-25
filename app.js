//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');


mongoose.connect("mongodb://localhost:27017/todolistDB");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// create a schema for the database
const itemsSchema ={
  name:String
};

//create a new collection
const Item = mongoose.model("Item", itemsSchema);

// add data
const john = new Item({
  name: "John"
});

const tinu = new Item({
    name: "tinu"
  });

const bolu = new Item({
    name: "Bolu"
  });

const defaultItems = [john, tinu, bolu];

//create a new schema for custom links
const listSchema = {
  name: String,
  items: [itemsSchema]
};

//create a new model or collection for custom links
const List = new mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){ //if there is nothing in the Item array, then it adds the defaultItems then redirects to the else statement. if not, it just renders what is in the Item array
    if (foundItems.length === 0){
      Item.insertMany(defaultItems,function(err){
        if (err){
          console.log(err);
        }else{
          console.log("successfully saved to DB");
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

  });
});

app.get("/:customName", function(req,res){
  const customName = _.capitalize(req.params.customName);

  List.findOne({name:customName}, function(err, results){

    if(!results){
      //create a new documentunder the listcollection
      const list = new List({ //to create a document uder the list collection
        name: customName,
        items: defaultItems
      });

      list.save();
      res.redirect("/" + customName);
    } else{
      res.render("list", {listTitle: results.name, newListItems: results.items});
    }
  })




})


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

    if (listName === "Today"){
      item.save();
      res.redirect("/");
    } else{
      List.findOne({name: listName}, function(err, foundList){
        if (err){
          console.log(err)
        }else{
          foundList.items.push(item);
          foundList.save();
          res.redirect("/"+ listName);
        }
      })
    }


})


app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox; //when you click on the checkbox, it submits to here through the post method and disappears because we delete it from the database
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){ //to delete an object from the database
      if(err){
        console.log(err)
      }else{
        console.log("Successfully deleted");
      }
      res.redirect("/");
    })
  } else{
      List.findOneAndUpdate({name:listName}, {$pull:{items:{_id:checkedItemId}}}, function(err,foundList){
        if(!err){
          res.redirect("/"+listName);
        }
      })
  }



})


app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function(){
  console.log("Server started on port 3000");
});
