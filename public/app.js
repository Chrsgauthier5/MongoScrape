// Grab the posts as a json
var printPosts = () => {
    $.getJSON("/posts", function (data) {
        // For each one
        for (var i = 0; i < data.length; i++) {
            // Display the apropos information on the page
            $("#scrapedPosts").append(
                "<p data-id='" + data[i]._id + "'>"
                + "<strong>Title: </strong>" + data[i].title + "<br />" + "<a href=" + data[i].link + "> Link </a>" + "<br />"
                + "<strong>Price: </strong>" + data[i].price + "<br />"
                + "<strong>Location: </strong>" + data[i].location + "<br />"
                + "<strong>Date/Time Posted: </strong>" + data[i].timePosted + "</p>"
                + "<button type='button' class='btn btn-info' id='savePost' data-id='" + data[i]._id + "'>Save Post</button>"
                + "<button type='button' class='btn btn-warning' id='makeNote' data-id='" + data[i]._id + "'>Make a Note</button>"
            );
        }
    });
}

$(document).on("click", "#scrapePosts", function() {
    console.log("hello");
    $.ajax({
        method: "GET",
        url: "/scrape"
    })
        .then(
            alert("Scraping Craigslist"),
            printPosts()
            );

});

$(document).on("click", "#savedPosts", function(){
    console.log("Going to saved posts page")
    document.location.href="saved";
});

// Whenever someone clicks a p tag
$(document).on("click", "#makeNote", function () {
    // Empty the postNotes from the note section
    $("#postNotes").empty();
    // Save the id from the p tag
    var thisId = $(this).attr("data-id");

    // Now make an ajax call for the Article
    $.ajax({
        method: "GET",
        url: "/posts/" + thisId
    })
        // With that done, add the note information to the page
        .then(function (data) {
            console.log(data);
            // The title of the article
            $("#postNotes").append("<h2>" + data.title + "</h2>");
            // An input to enter a new title
            $("#postNotes").append("<input id='titleinput' name='title' placeholder='note title'>");
            // A textarea to add a new note body
            $("#postNotes").append("<textarea id='bodyinput' name='body' placeholder='Make note here..'></textarea>");
            // A button to submit a new note, with the id of the article saved to it
            $("#postNotes").append("<button type='button' class='btn btn-danger' data-id='" + data._id + "' id='savenote'>Save Note</button>");

            // If there's a note in the article
            if (data.note) {
                // Place the title of the note in the title input
                $("#titleinput").val(data.note.title);
                // Place the body of the note in the body textarea
                $("#bodyinput").val(data.note.body);
            }
        });
});

// When you click the savenote button
$(document).on("click", "#savenote", function () {
    // Grab the id associated with the article from the submit button
    var thisId = $(this).attr("data-id");

    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
        method: "POST",
        url: "/posts/" + thisId,
        data: {
            // Value taken from title input
            title: $("#titleinput").val(),
            // Value taken from note textarea
            body: $("#bodyinput").val()
        }
    })
        // With that done
        .then(function (data) {
            // Log the response
            console.log(data);
            // Empty the postNotes section
            $("#postNotes").empty();
        });

    // Also, remove the values entered in the input and textarea for note entry
    $("#titleinput").val("");
    $("#bodyinput").val("");
});

$(document).on("click", "#savePost", function() {
    let thisId = $(this).attr("data-id");

    $.ajax({
        method: "POST",
        url: "/saved/" + thisId,
        data: {id: thisId}
    })
    .then(function(data){
        console.log(data);
       
    });
    $(this).hide() //hides the save button once saved
});