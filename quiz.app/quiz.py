import json   
import os   
import random 
class Question: 
    def __init__(self,question,answer,category,difficulty,question_type,options=None): 
        self.question = question 
        self.answer = answer 
        self.category = category 
        self.difficulty = difficulty 
        self.question_type = question_type 
        self.options = options 
    def __str__(self): 
        return f"{self.question},{self.answer},{self.category},{self.difficulty},{self.question_type},{self.options}" 
    def to_dictionary(self): 
        data = { 
            "question":self.question, 
            "answer":self.answer, 
            "category":self.category, 
            "difficulty":self.difficulty, 
            "question_type":self.question_type, 
            "options":self.options 
 
        } 
        return data 
 
 
maths_medium_1 = Question("Derivative of x^2", "2x", "maths", "medium","normal") 
 
maths_questions = [ 
    
    
    maths_medium_1, 
] 
all_questions = ( 
    maths_questions  
) 
class Question_bank: 
    def __init__(self): 
        self.questions = {} 
    def add_question(self,question): 
        
        if question.category in self.questions: 
            print("the category already exist so moving on to difficulties") 
             
        else : 
            self.questions.update({question.category:{}}) 
        if question.difficulty in  self.questions[question.category]: 
            print("the difficulties already exist now adding question objects in list") 
        else: 
            self.questions[question.category][question.difficulty]= [] 
        self.questions[question.category][question.difficulty].append(question) 
    def display_questions(self): 
        if len(self.questions)== 0: 
            print("the question bank is empty:") 
        else: 
            for category in self.questions: 
                print(f"category:{category}") 
                for difficulty in self.questions[category]: 
                    print(f"difficulties:{difficulty}") 
                    for question_object  in self.questions[category][difficulty]: 
                        print(question_object) 
    def find_question(self,question_text):  
        for category in self.questions: 
            print(category) 
            for difficulty in self.questions[category]: 
                for question_object in self.questions[category][difficulty]: 
                     
                    if question_object.question == question_text: 
                        return question_object 
        return None 
                     
 
 
                   
 
        
    def delete_question(self,question_text): 
        question = self.find_question(question_text) 
        if question is None: 
            print("that question deosnt exixt :") 
        else: 
            self.questions[question.category][question.difficulty].remove(question)    
            print("the question has been removed ") 
    def load_questions(self):
            self.questions =  {}
            
            
 
            if not os.path.exists("questions.json"): 
                with open("questions.json", "w") as f: 
                    json.dump({}, f) 
            with open("questions.json","r")as f: 
                question_data = json.load(f) 
                     
                for category in question_data: 
                    for difficulty in question_data[category]: 
                        for question_dict in question_data[category][difficulty]: 
                            question = Question( 
                                                question_dict["question"], 
                                                question_dict["answer"], 
                                                category, 
                                                difficulty, 
                                                question_dict["question_type"], 
                                                question_dict["options"] 
                                                                            ) 
                            self.add_question(question) 
                           
                             
 
        
             
             
             
 
                 
    def edit_question(self,question,field,new_value): 
      
            if field == "answer": 
                question.answer = new_value 
            elif field == "question": 
                question.question = new_value 
            elif field == "category": 
                new_category,new_difficulty = new_value 
                self.questions[question.category][question.difficulty].remove(question) 
                if new_category not in self.questions : 
                    self.questions[new_category]= {} 
                if  new_difficulty not in self.questions[new_category]: 
                    self.questions[new_category][ new_difficulty] =[] 
                question.category = new_category 
                question.difficulty = new_difficulty 
                self.questions[question.category][question.difficulty].append(question) 
            elif field == "difficulty": 
                new_difficulty = new_value 
                self.questions[question.category][question.difficulty].remove(question)  
                if new_difficulty not in self.questions[question.category]: 
                    self.questions[question.category][ new_difficulty] =[] 
                question.difficulty = new_difficulty 
                self.questions[question.category][question.difficulty].append(question) 
            elif field == "question_type":

                new_question_type, new_options = new_value

    
                if new_question_type == "normal":

                    if question.question_type == "mcq":
                        question.answer = question.options[question.answer]

                    question.question_type = "normal"
                    question.options = None

                elif new_question_type == "mcq":
                    if question.question_type == "normal":
                        for key, value in new_options.items():
                            if value == question.answer:
                                question.answer = key
                                question.question_type = "mcq"
                                question.options = new_options
                                break
                            
                                
                                
                        
                                
                        else:
                            print("The existing answer must be one of the options.")
                            return
                    elif question.question_type == "mcq":
                        old_answer = question.options[question.answer]
                    
                        
                    
                        for key, value in new_options.items():
                            if value == old_answer:
                                question.answer = key
                                question.options = new_options
                                break
                        else:
                            print("your existing correct answer isnt in your new options so change failed")
                            return    
                    else:
                        print("the question type doesnt exist so change cant occur")
                        return
                    
                else:   
                    print("invalid question types.") 
                    return   
    
                
                






                         
 
 
    def save_questions(self): 
         
        data = {} 
        for category in self.questions: 
            data[category]={} 
            for difficulty in self.questions[category]: 
                data[category][difficulty]=[] 
                for questions in self.questions[category][difficulty]: 
                     data[category][difficulty].append(questions.to_dictionary()) 
        with open("questions.json",'w')as f:             
                            
            json.dump(data,f,indent= 4)  
    def retiriving_questions(self,selected_category,selected_difficulty):
        stored_questions = []
        if selected_category in self.questions:
            if selected_difficulty in self.questions[selected_category]:
                for retrived_questions in self.questions[selected_category][selected_difficulty]:
                    stored_questions.append(retrived_questions)
                    
                return stored_questions

            else:
                print("the difficutly doesnt exist:")
                return None

        else:
            print("the question category doesnt exist so question isnt also there")
            return None
            
                

           


bank =Question_bank()

            
                
               


                         
               
     
                   
 
 
           
                  
             
 
            
                 
# bank = Question_bank()
# bank.load_questions()

 
class Quiz: 
    def __init__(self,question_bank): 
        self.question_bank = question_bank 
        self.current_questions = None 
        self.category = None 
        self.difficulty = None 
        self.score = 0 
    def select_questions(self,selected_category,selected_difficulty,selected_question_no): 
        self.current_questions = self.question_bank.retiriving_questions(selected_category,selected_difficulty)
        

        
        self.category= selected_category
        self.difficulty = selected_difficulty
        if len(self.current_questions) == 0:
            print("There are no questions in this category and difficulty.")
            return    
        if len(self.current_questions) >= selected_question_no: 
            self.current_questions = random.sample(self.current_questions, selected_question_no)
            
            return 
         
            
           
 
           
 
           
 
                
                    
 
                    
                       
 
 
        elif len(self.current_questions) < selected_question_no: 
            print("we dont have that much questions currently in this category/difficulty so make peace with it :") 
            selected_question_no = len(self.current_questions) 
            self.current_questions = random.sample(self.current_questions, selected_question_no) 
            return 
 
 
     
 
        
    def start_quiz(self,selected_category,selected_difficulty,selected_question_no): 
        self.score = 0 
        self.select_questions(selected_category,selected_difficulty,selected_question_no) 
        question_number = 0 
        correct_answers = 0 
        wrong_answers = 0 
        
        for question in self.current_questions: 
            question_number += 1 
            print(f'question number is {question_number}') 
            print(question.question) 
             
            if question.question_type == "mcq": 
                     
                    for options,value in question.options.items(): 
                        print(f"{options}.{value}") 
                    while True:        
                        user_answer = input("enter your option no here:").upper().strip() 
                        if user_answer in question.options: 
                                break 
                        else: 
                            print("invalid options Enter options A,B,C,D") 
            else:  
                user_answer = input("enter your answer here :").strip() 
             
 
             
            is_correct = self.rules_to_check_answer(question,user_answer) 
            if is_correct: 
                mark = self.get_marks(question) 
                self.score += mark 
                correct_answers += 1 
                print("your answer is right") 
            else: 
                wrong_answers += 1 
                print(f"your answer was incorect correct it should be {question.answer}:")  
        total_marks = self.get_total_marks() 
         
        percentage = (self.score/total_marks)*100 
 
        print(f"Correct: {correct_answers}") 
        print(f"Wrong: {wrong_answers}") 
        print(f"Score: {self.score}") 
        print(f"Percentage: {percentage}%") 
        print(f"Category: {self.category}") 
        print(f"Difficulty: {self.difficulty}") 
        
        self.save_history(self.category, 
                self.difficulty, 
                len(self.current_questions), 
                correct_answers, 
                wrong_answers, 
                total_marks, 
                percentage 
                        ) 
        
 
 
                
       
 
                 
                 
                 
                 
 
             
                     
 
 
                         
    def get_marks(self,question): 
        marks = {"easy":2,"medium":4,"hard":6} 
        mark = marks[question.difficulty] 
        if question.question_type == "mcq": 
            mark = mark/2 
        return mark 
    def rules_to_check_answer(self,question,user_answer): 
          if question.question_type == "mcq": 
              return user_answer == question.answer 
          else: 
              if question.difficulty == "easy": 
                  return user_answer.lower() == question.answer.lower() 
              elif question.difficulty == "medium": 
                  user_answer = " ".join(user_answer.split()) 
                  correct_answer = " ".join(question.answer.split()) 
                  return user_answer.lower() == correct_answer.lower() 
              else: 
                  return user_answer.strip() == question.answer.strip() 
 
    def get_total_marks(self): 
        total_marks = 0 
        for question in self.current_questions: 
            total_marks += self.get_marks(question) 
        return total_marks     
                   
    def save_history(self,category,difficulty,total_questions,correct_answers,wrong_answers,total_marks,percentage): 
         
        if not os.path.exists("history.json"): 
                        with open("history.json", "w") as f: 
                            json.dump([], f) 
        with open("history.json","r")as f: 
                                history =json.load(f) 
                                
                                history.append({ 
                                "category": category, 
                                "difficulty": difficulty, 
                                "total_questions": total_questions, 
                                "correct_answers": correct_answers, 
                                "wrong_answers": wrong_answers, 
                                "score": self.score, 
                                "total_marks": total_marks, 
                                "percentage": percentage 
                                                          }) 
        with open("history.json", "w") as f: 
            json.dump(history, f, indent=4) 
    def show_history(self): 
        quiz_counter =0 
        if not os.path.exists("history.json"): 
            with open("history.json","w")as f: 
                json.dump([],f)   
        with open("history.json","r")as f :  
            history = json.load(f)       
        for quiz in history: 
            quiz_counter += 1 
 
            print(f"\n========== Quiz {quiz_counter} ==========") 
            print(f"Category: {quiz['category']}") 
            print(f"Difficulty: {quiz['difficulty']}") 
            print(f"Questions: {quiz['total_questions']}") 
            print(f"Correct: {quiz['correct_answers']}") 
            print(f"Wrong: {quiz['wrong_answers']}") 
            print(f"Score: {quiz['score']} / {quiz['total_marks']}") 
            print(f"Percentage: {quiz['percentage']}%") 
             
                 
 
 
 
 
 
 
 
 
           
                 
         
         
            
 
     
        
         
 
        
             
 
        
                                                                 
                                                                     
     
quiz = Quiz(bank)         
 
 
def admin_menu(bank): 
    while True: 
         
        choice = input(""" 
         ===== ADMIN MENU ===== 
                1. Add Question 
                2. Delete Question 
                3. Edit Question 
                4. Display Questions 
                5. find question 
                6.load questions 
                7.save_questions 
                8.Back 
                 
                """).strip() 
         
 
        if choice == "1": 
             
            new_question = input("Enter your question here") 
            new_answer = input("Enter your answer here or (option letter for mcq):") 
            new_category = input("Enter your category here:") 
            new_difficulty = input("Enter you difficulty here:") 
            new_question_type = input("Enter your question type here:").strip().lower() 
                 
            if new_question_type == "mcq": 
                options = input("Enter 4 options separated by commas: ").split(",") 
                options = [option.strip() for option in options] 
 
                new_options = { 
                    "A": options[0], 
                    "B": options[1], 
                    "C": options[2], 
                    "D": options[3] 
                                    } 
 
                new_answer = new_answer.strip().upper() 
 
                if new_answer not in new_options: 
                        print("Correct answer must be A, B, C, or D.") 
                         
                        continue 
            elif new_question_type == "normal": 
                    new_options = None 
 
            else: 
                print("the question type must be in between(normal,mcq)")     
                continue 
                  
            question = Question(new_question,new_answer,new_category,new_difficulty,new_question_type,new_options) 
            bank.add_question(question) 
            print("the question has been sucesfully added::") 
                     
        elif choice == "2": 
            question_text =input("enetr your question here you want to delete") 
            bank.delete_question(question_text)  
            print("the question has been suceesfully deleted:") 
        elif choice == "3": 
            question_text = input("enter your question you want to edit") 
            question = bank.find_question(question_text) 
            if question is None: 
                print("the question isnt found :") 
            else: 
                menu = input(''' 
                            1:edit answer 
                            2:edit question 
                            3:edit category 
                            4:edit difficulty 
                            5.edit question type 
                            6.edit options 
                            enter your number here''').strip() 
                if menu == "1": 
                    field = "answer" 
                    new_answer = input("enter the answer you want to change:") 
                    new_value = new_answer 
                    bank.edit_question(question,field,new_value) 
                    
                elif menu == "2": 
                    field = "question" 
                    new_question = input("enter the question you want to change :") 
                    new_value = new_question 
 
                    bank.edit_question(question,field,new_value) 
                elif menu == "3": 
                    field = "category" 
                    new_category = input("enter your new category here:") 
                    new_difficulty = input("enter you new difficulty here:") 
                    new_value = (new_category,new_difficulty) 
                    bank.edit_question(question,field,new_value) 
                 
                elif menu == "4": 
                    field = "difficulty" 
                    new_difficulty = input("enter your new difficulty here:") 
                    new_value = new_difficulty 
 
                    bank.edit_question(question,field,new_value) 
                elif menu == "5": 
                    field = "question_type" 
                    new_question_type = input('enter your new question type you want to change here:').strip().lower() 
                    if new_question_type == "normal": 
                        new_options = None 
                    elif  new_question_type == "mcq": 
                        while True: 
 
                            new_options = input("please enter four options separted by comas,").split(",") 
                            new_options = [option.strip() for option in new_options]
                            if len(new_options) != 4:
                                print("you must enter exactly enter four options") 
                                continue
                            new_options = { 
                                            "A":new_options[0], 
                                            "B":new_options[1], 
                                            "C":new_options[2], 
                                            "D":new_options[3] 
                                                            } 
                         
                            break 
                    new_value =(new_question_type,new_options) 
                    bank.edit_question(question,field,new_value) 
                                         
                    
                                         
                elif menu == '6': 
                    print       
                print("chages has been succesfully taken place:")     
        elif choice == "4": 
            bank.display_questions() 
        elif choice == "5": 
            question_text = input("enter your question here you want find").strip() 
            result = bank.find_question(question_text) 
            if result is None: 
                print("the question  isnt there")  
            else: 
                print("the question was found") 
                print(result)  
        elif choice == "6": 
            bank.load_questions() 
            print("Questions loaded successfully.") 
 
        elif choice == "7": 
            bank.save_questions() 
            print("Questions saved successfully.") 
 
        elif choice == "8": 
             
            bank.save_questions() 
            print("goodbye") 
            break       
 
        else : 
            print("inavlid choice:") 
                        
 
 
 
 
 
def player_menu(quiz,question_bank): 
    while True: 
        choice = input(""" 
        ===== PLAYER MENU ===== 
 
        1. Start Quiz 
        2. Show History 
        3. Back 
 
        Enter your choice: """).strip() 
 
        if choice == "1":
            for category in question_bank.questions: 
                print(category) 
            selected_category =input("enter your category here you want to answer questions:").strip()
            if selected_category not in question_bank.questions:
                print('the category doesnt exist so restarting again :')
                continue
            for difficulties in question_bank.questions[selected_category]: 
                print(f"the available difficulties are {difficulties}") 
            selected_difficulty =input("enter your difficulty here you want to answer questions:").strip()
            if selected_difficulty not in question_bank.questions[selected_category]:
                print("the difficulty doesnt exist  restarting again :")
                continue 
            
                
             
            selected_question_no =int(input("enter your no of question here you want to answer:"))
            quiz.start_quiz(selected_category,selected_difficulty,selected_question_no) 
           
            
           
           
            

 
        elif choice == "2": 
            quiz.show_history() 
 
        elif choice == "3": 
            break 
 
        else: 
            print("Invalid choice.") 
 
 
question_bank = Question_bank()         
 
                  
    
             
             
 
             
            
def main_menu(bank, quiz): 
    while True: 
        choice = input(""" 
        ========== QUIZ APP ========== 
 
        1. Admin Menu 
        2. Player Menu 
        3. Exit 
 
        Enter your choice: """).strip() 
 
        if choice == "1": 
            admin_menu(bank) 
 
        elif choice == "2": 
            player_menu(quiz,bank) 
 
        elif choice == "3": 
            print("Exiting quiz...") 
            break 
 
        else: 
            print("Invalid choice.") 
               
 
         
question_bank = Question_bank()

question_bank.load_questions()

quiz = Quiz(question_bank)

main_menu(question_bank, quiz)  