

function copyrightInit(){
    const today = new Date();
    const year = today.getFullYear();
    
    var footer_string = "Copyright &copy <b>2025-" + year + "</b> - Nick Buonarota";
    
    document.getElementById("copyright").innerHTML = footer_string;
}