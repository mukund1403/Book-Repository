//All the multer code commented out needs to be there if filepond is not used
//Check other changes that have to be made to _form_fields as well
//Remember to npm i multer to use multer again

const express = require('express')
const router = express.Router()
//const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Book = require('../models/book')
const Author = require('../models/author')
const uploadPath = path.join('public',Book.coverImageBasePath)
const imageMimeTypes = ['image/jpg','image/png','image/gif']
/*const upload = multer({
    dest: uploadPath,
    fileFilter: (req,file,callback) =>{
        callback(null,imageMimeTypes.includes(file.mimetype))
    }
})*/

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
router.post("/",/*upload.single('cover')*/ async (req,res)=>{
    //const fileName = req.file != null ? req.file.filename : null
    const book = new Book({ 
        title: req.body.title,
        description: req.body.description,
        publishDate: new Date(req.body.publishDate),
        author: req.body.author,
        pageCount: req.body.pageCount,
        //coverImageName: fileName
    })
    
    try{
        saveCover(book,req.body.cover)
        const newBook = await book.save()
        res.redirect(`/books/${newBook.id}`)
    }
    catch{
        renderNewPage(res,book,true)
        /*if(book.coverImageName != null){
            removeBookCover(book.coverImageName)*/
        }
    })

//Show book
router.get('/:id',async (req,res)=>{
    try{
        const book = await Book.findById(req.params.id).populate('author').exec()
        res.render('books/show',{book : book})
    } catch{
        res.redirect('/')
    }
})

//Edit Book route
router.get("/:id/edit",async (req,res)=>{
    
    try{
        const book = await Book.findById(req.params.id)
        renderEditPage(res,book)

    } catch{
        res.redirect('/')
    }
})

router.put("/:id",/*upload.single('cover')*/ async (req,res)=>{
    //const fileName = req.file != null ? req.file.filename : null
    let book    
    try{
        book = await Book.findById(req.params.id)
        book.title = req.body.title
        book.author = req.body.author
        book.publishDate = req.body.publishDate
        book.pageCount = req.body.pageCount
        book.description = req.body.description
        if(req.body.cover != null && req.body.cover !== ''){
            saveCover(book, req.body.cover)
        }
        await book.save()
        res.redirect(`/books/${book.id}`)
    }
    catch{
        if(book != null){
            renderEditPage(res,book,true)
        } else{
            redirect('/')
        }
        
        /*if(book.coverImageName != null){
            removeBookCover(book.coverImageName)*/
        }
    })

router.delete('/:id',async (req,res)=>{
    let book
    try{
        book = await Book.findById(req.params.id)
        const response = await Book.deleteOne({_id:req.params.id})
        res.redirect('/books')
    } catch{
            if(book!=null){
                res.render('books/show',{
                book:book,
                errorMessage: 'Could not delete book'
                })
            } else{
                res.redirect('/')
            }
        }

    })

async function renderEditPage(res,book,hasError = false){
    renderFormPage(res,book,'edit',hasError)
}

async function renderNewPage(res,book,hasError = false){
    renderFormPage(res,book,'new',hasError)
}

async function renderFormPage(res,book,form,hasError = false){
    try{
        const authors = await Author.find({})
        const params = {book:book , authors:authors}
        if (hasError){
            if(form==='edit'){
                params.errorMessage = 'Error Editing book'
            }else{
                params.errorMessage = 'Error Creating book'
            }
        } 
        res.render(`books/${form}`,params)
    } catch{
        res.redirect('/books')
    }
}

/*function removeBookCover(fileName){
    fs.unlink(path.join(uploadPath,fileName),err =>{
        if(err) console.error(err)
    })
}*/

function saveCover(book, coverEncoded){
    if(coverEncoded == null) return
    const cover = JSON.parse(coverEncoded)
    if(cover != null && imageMimeTypes.includes(cover.type)){
        book.coverImage = new Buffer.from(cover.data,'base64')
        book.coverImageType = cover.type
    }
}

module.exports = router