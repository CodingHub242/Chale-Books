import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersPage } from './users.page';
import { Api } from '../services/api';
import { Auth } from '../services/auth';
import { of } from 'rxjs';

describe('UsersPage', () => {
  let component: UsersPage;
  let fixture: ComponentFixture<UsersPage>;
  let apiMock: any;
  let authMock: any;

  beforeEach(async () => {
    apiMock = {
      getUsers: jasmine.createSpy('getUsers').and.returnValue(of({ success: true, data: [] })),
      getRoles: jasmine.createSpy('getRoles').and.returnValue(of({ success: true, data: [] })),
      createUser: jasmine.createSpy('createUser').and.returnValue(of({ success: true })),
      updateUser: jasmine.createSpy('updateUser').and.returnValue(of({ success: true })),
      deleteUser: jasmine.createSpy('deleteUser').and.returnValue(of({ success: true })),
    };

    authMock = {
      isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
      getUser: jasmine.createSpy('getUser').and.returnValue({ id: 1, name: 'Test User', role: 'admin' }),
    };

    await TestBed.configureTestingModule({
      imports: [UsersPage],
      providers: [
        { provide: Api, useValue: apiMock },
        { provide: Auth, useValue: authMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    expect(apiMock.getUsers).toHaveBeenCalled();
  });

  it('should load roles on init', () => {
    expect(apiMock.getRoles).toHaveBeenCalled();
  });

  it('should open modal for new user', () => {
    component.openModal();
    expect(component.isModalOpen).toBe(true);
    expect(component.editingUser).toBeNull();
  });

  it('should open modal for editing user', () => {
    const user = { id: 1, name: 'Test', email: 'test@test.com', role: 'admin' };
    component.openModal(user);
    expect(component.isModalOpen).toBe(true);
    expect(component.editingUser).toEqual(user);
    expect(component.formData.name).toEqual('Test');
  });

  it('should close modal', () => {
    component.isModalOpen = true;
    component.editingUser = { id: 1 };
    component.closeModal();
    expect(component.isModalOpen).toBe(false);
    expect(component.editingUser).toBeNull();
  });

  it('should return correct role color', () => {
    expect(component.getRoleColor('admin')).toEqual('danger');
    expect(component.getRoleColor('manager')).toEqual('warning');
    expect(component.getRoleColor('accountant')).toEqual('success');
    expect(component.getRoleColor('other')).toEqual('primary');
  });

  it('should return correct role label', () => {
    expect(component.getRoleLabel('admin')).toEqual('Admin');
    expect(component.getRoleLabel('manager')).toEqual('Manager');
  });

  it('should show toast message', () => {
    component.showToastMessage('Test message', 'success');
    expect(component.toastMessage).toEqual('Test message');
    expect(component.toastColor).toEqual('success');
    expect(component.showToast).toBe(true);
  });
});
