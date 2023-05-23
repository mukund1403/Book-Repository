const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Book = require('../models/book')
const Author = require('../models/author')
const uploadPath = path.join('public',Book.coverImageBasePath)
const imageMimeTypes = ['image/jpg','image/png','image/gif']
const upload = multer({
    dest: uploadPath,
    fileFilter: (req,file,callback) =>{
        callback(null,imageMimeTypes.includes(file.mimetype))
    }
})

//All Books route
router.get('/',async(req,res)=>{
    let query = Book.find()
    if(req.query.title != null && req.query.title != ''){
        query = query.regex('title',new RegExp(req.query.title,'i'))
    }
    if(req.query.publishedBefore != null && req.query.publishedBefore != ''){
        query = query.lte('publishDate',req.query.publishedBefore)
    }
    if(req.query.publishedAfter != null && req.query.publishedAfter != ''){
        query = query.gte('publishDate',req.query.publishedAfter)
    }
    try{
        const books = await query.exec() 
        res.render('books/index', {   
            books: books, 
            searchOptions: req.query
    })
    } catch{
        res.redirect('/')
    }
    
})

//New Book route
router.get("/new",async (req,res)=>{
    renderNewPage(res,new Book())
})

//Create Book route
router.post("/",upload.single('cover'), async (req,res)=>{
    const fileName = req.file != null ? req.file.filename : null
    const book = new Book({ 
        title: req.body.title,
        description: req.body.description,
        publishDate: new Date(req.body.publishDate),
        author: req.body.author,
        pageCount: req.body.pageCount,
        coverImageName: fileName
    })
    try{
        const newBook = await book.save()
        //res.render(`/books/${newBook.id}`)
        res.redirect('books')
    }
    catch{
        renderNewPage(res,book,true)
        if(book.coverImageName != null){
            removeBookCover(book.coverImageName)
        }
    }
})

async function renderNewPage(res,book,hasError = false){
    try{
        const authors = await Author.find({})
        const params = {book:book , authors:authors}
        if (hasError) params.errorMessage = 'Error Creating book'
        res.render('books/new',params)
    } catch{
        res.redirect('/books')
    }
}

function removeBookCover(fileName){
    fs.unlink(path.join(uploadPath,fileName),err =>{
        if(err) console.error(err)
    })
}

module.exports = router