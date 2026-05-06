import { addTask, deleteTask, toggleTask, getTasks, getActiveTaskId, setActiveTaskId, incrementPomodoros, reloadTasks } from '../src/js/tasks';

describe('tasks module', () => {
  beforeEach(() => {
    localStorage.clear();
    reloadTasks();
  });

  test('addTask creates a task with correct properties', () => {
    const task = addTask('Test task');
    expect(task.title).toBe('Test task');
    expect(task.completed).toBe(false);
    expect(task.pomodoros).toBe(0);
    expect(task.id).toBeTruthy();
  });

  test('addTask trims whitespace and limits length', () => {
    const task = addTask('  Hello World  ');
    expect(task.title).toBe('Hello World');
  });

  test('addTask throws on empty title', () => {
    expect(() => addTask('')).toThrow();
    expect(() => addTask('   ')).toThrow();
  });

  test('deleteTask removes a task', () => {
    const task = addTask('To delete');
    const result = deleteTask(task.id);
    expect(result).toBe(true);
    expect(getTasks().find(t => t.id === task.id)).toBeUndefined();
  });

  test('deleteTask returns false for non-existent id', () => {
    expect(deleteTask('non-existent')).toBe(false);
  });

  test('toggleTask flips completed state', () => {
    const task = addTask('Toggle me');
    expect(task.completed).toBe(false);
    const updated = toggleTask(task.id);
    expect(updated?.completed).toBe(true);
  });

  test('incrementPomodoros increases count', () => {
    const task = addTask('Focus task');
    const updated = incrementPomodoros(task.id);
    expect(updated?.pomodoros).toBe(1);
  });

  test('setActiveTaskId sets active task', () => {
    const task = addTask('Active task');
    setActiveTaskId(task.id);
    expect(getActiveTaskId()).toBe(task.id);
  });

  test('getTasks returns incomplete tasks first', () => {
    addTask('Task 1');
    const task2 = addTask('Task 2');
    toggleTask(task2.id);
    addTask('Task 3');
    const all = getTasks();
    expect(all[0].completed).toBe(false);
    expect(all[all.length - 1].completed).toBe(true);
  });
});
