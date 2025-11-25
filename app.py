from flask import Flask, render_template, request, jsonify
from models import db, Workout, ToDo
from datetime import datetime
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/workout_tracker.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

# --- Workout Routes ---
@app.route('/api/workouts', methods=['GET', 'POST'])
def handle_workouts():
    if request.method == 'POST':
        data = request.json
        try:
            date_obj = datetime.strptime(data['date'], '%Y-%m-%d').date()
            new_workout = Workout(
                date=date_obj,
                exercise_name=data['exercise_name'],
                sets=int(data['sets']),
                reps=int(data['reps']),
                weight=float(data['weight'])
            )
            db.session.add(new_workout)
            db.session.commit()
            return jsonify(new_workout.to_dict()), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 400
    
    # GET
    date_str = request.args.get('date')
    if date_str:
        try:
            query_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            workouts = Workout.query.filter_by(date=query_date).all()
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
    else:
        workouts = Workout.query.all()
        
    return jsonify([w.to_dict() for w in workouts])

@app.route('/api/workouts/<int:id>', methods=['DELETE'])
def delete_workout(id):
    workout = Workout.query.get_or_404(id)
    db.session.delete(workout)
    db.session.commit()
    return jsonify({'message': 'Deleted successfully'})

# --- To-Do Routes ---
@app.route('/api/todos', methods=['GET', 'POST'])
def handle_todos():
    if request.method == 'POST':
        data = request.json
        try:
            date_obj = datetime.strptime(data['date'], '%Y-%m-%d').date()
            new_todo = ToDo(
                date=date_obj,
                task=data['task']
            )
            db.session.add(new_todo)
            db.session.commit()
            return jsonify(new_todo.to_dict()), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 400

    # GET
    date_str = request.args.get('date')
    if date_str:
        try:
            query_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            todos = ToDo.query.filter_by(date=query_date).all()
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
    else:
        todos = ToDo.query.all()

    return jsonify([t.to_dict() for t in todos])

@app.route('/api/todos/<int:id>', methods=['PUT', 'DELETE'])
def update_todo(id):
    todo = ToDo.query.get_or_404(id)
    
    if request.method == 'DELETE':
        db.session.delete(todo)
        db.session.commit()
        return jsonify({'message': 'Deleted successfully'})
    
    # PUT (Toggle complete)
    data = request.json
    if 'completed' in data:
        todo.completed = data['completed']
    
    db.session.commit()
    return jsonify(todo.to_dict())

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', debug=True)
