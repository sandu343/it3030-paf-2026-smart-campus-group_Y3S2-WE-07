package com.smartcampus.backend.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

@Document(collection = "users")
public class User {
    @Id
    private String id;
    
    private String name;
    
    @Indexed(unique = true)
    private String email;

    @Indexed(unique = true, sparse = true)
    @Pattern(regexp = "^[a-z0-9._]{4,20}$", message = "Username must be 4-20 chars, lowercase letters, numbers, dots or underscores")
    @Size(min = 4, max = 20, message = "Username must be between 4 and 20 characters")
    private String username;
    
    private String passwordHash;
    
    private Role role;

    private String staffId;

    private String department;

    private String phoneNumber;

    private boolean isStaff;

    private boolean mustChangePassword;

    private LocalDateTime lastLoginAt;
    
    @CreatedDate
    private LocalDateTime createdAt;

    private String createdByAdminId;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;

    private boolean active = true;

    // Constructors
    public User() {}

    public User(String id,
                String name,
                String email,
                String username,
                String passwordHash,
                Role role,
                String staffId,
                String department,
                String phoneNumber,
                boolean isStaff,
                boolean mustChangePassword,
                LocalDateTime lastLoginAt,
                LocalDateTime createdAt,
                String createdByAdminId,
                LocalDateTime updatedAt,
                boolean active) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
        this.staffId = staffId;
        this.department = department;
        this.phoneNumber = phoneNumber;
        this.isStaff = isStaff;
        this.mustChangePassword = mustChangePassword;
        this.lastLoginAt = lastLoginAt;
        this.createdAt = createdAt;
        this.createdByAdminId = createdByAdminId;
        this.updatedAt = updatedAt;
        this.active = active;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getStaffId() {
        return staffId;
    }

    public void setStaffId(String staffId) {
        this.staffId = staffId;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public boolean isStaff() {
        return isStaff;
    }

    public void setStaff(boolean staff) {
        isStaff = staff;
    }

    public boolean isMustChangePassword() {
        return mustChangePassword;
    }

    public boolean getMustChangePassword() {
        return mustChangePassword;
    }

    public void setMustChangePassword(boolean mustChangePassword) {
        this.mustChangePassword = mustChangePassword;
    }

    public LocalDateTime getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(LocalDateTime lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getCreatedByAdminId() {
        return createdByAdminId;
    }

    public void setCreatedByAdminId(String createdByAdminId) {
        this.createdByAdminId = createdByAdminId;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    // Backward-compatible accessors
    public String getPhone() {
        return phoneNumber;
    }

    public void setPhone(String phone) {
        this.phoneNumber = phone;
    }
}
