function push(){
    var title = document.getElementById("title").value;
    var content = document.getElementById("content").value;
    var image = document.getElementById("selectImage").files[0];
    var submitButton = document.getElementById("submitButton");
    submitButton.onclick = function(){
         var date = new Date();
         var id = makeid();
         var timeStamp = date.getTime();
         var newsId = timeStamp + id;
         uploadFile(image, newsId);
    };
}

function uploadFile(file, fileName){
    var url = 'https://elvinjin.com:8081/api/news/uploadImage/' + fileName;
    var xhr = new XMLHttpRequest();
    var fd = new FormData();
    xhr.open("POST", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // Every thing ok, file uploaded
            console.log(xhr.responseText); // handle response.
            alert("Image Uploaded!");
        }
    };
    fd.append("upload_file", file);
    xhr.send(fd);
}

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
