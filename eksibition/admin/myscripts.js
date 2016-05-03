function addItem(){
	var form = document.getElementById("form");
    alert("Hello World")
	var xmlHttp = new XMLHttpRequest();
	// xmlHttp.onreadystatechange = function()
 //    {
 //        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
 //        {
 //            form.innerHTMl += xmlHttp.responseText
 //        }
 //    }; 
    xmlHttp.open( "POST", "http://localhost:8080/api/admin/addItem", false ); // false for synchronous request
    xmlHttp.body.token = form.elements.namedItem("token");
    xmlHttp.body.uuid = form.elements.namedItem("uuid");
    xmlHttp.body.major = form.elements.namedItem("major");
    xmlHttp.body.minor = form.elements.namedItem("minor");
    xmlHttp.body.itemName = form.elements.namedItem("itemName");
    xmlHttp.body.profileImagePath = form.elements.namedItem("profileImagePath");
    xmlHttp.body.author = form.elements.namedItem("author");
    xmlHttp.body.country = form.elements.namedItem("country");
    xmlHttp.body.textDescription = form.elements.namedItem("textDescription");
    xmlHttp.body.audioFilePath = form.elements.namedItem("audioFilePath");
    xmlHttp.body.galleryPath = form.elements.namedItem("galleryPath");
    xmlHttp.body.token = form.elements.namedItem("token");
    xmlHttp.body.coordinateX = form.elements.namedItem("coordinateX");
    xmlHttp.body.coordinateY = form.elements.namedItem("coordinateY");
    xmlHttp.body.coordinateY = form.elements.namedItem("coordinateY");
    xmlHttp.body.introduceTime = form.elements.namedItem("introduceTime");
    xmlHttp.body.inExhibition = form.elements.namedItem("inExhibition");
    xmlHttp.body.viewCount = form.elements.namedItem("viewCount");
    xmlHttp.body.likeCount = form.elements.namedItem("likeCount");
    xmlHttp.body.shareCount = form.elements.namedItem("shareCount");
    xmlHttp.send();
}