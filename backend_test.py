#!/usr/bin/env python3
"""
Backend API Testing for AI-Driven Booth Management System
Tests all endpoints and full workflow functionality
"""

import requests
import json
import sys
from datetime import datetime

class BoothManagementTester:
    def __init__(self, base_url="http://localhost:8001/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_health_check(self):
        """Test health endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success and data.get("status") == "healthy":
                self.log_test("Health Check", True, f"Status: {data.get('status')}")
                return True
            else:
                self.log_test("Health Check", False, f"Status: {response.status_code}, Data: {data}")
                return False
        except Exception as e:
            self.log_test("Health Check", False, str(e))
            return False

    def test_seed_data(self):
        """Test seeding initial data"""
        try:
            response = requests.post(f"{self.base_url}/seed", timeout=15)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success:
                self.log_test("Seed Data", True, f"Users: {data.get('users_created', 0)}, Calls: {data.get('calls_created', 0)}")
                return True
            else:
                self.log_test("Seed Data", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Seed Data", False, str(e))
            return False

    def test_get_booths(self):
        """Test getting booths"""
        try:
            response = requests.get(f"{self.base_url}/booths", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else []
            
            if success and len(data) > 0:
                booth_17 = next((b for b in data if b["id"] == 17), None)
                booth_18 = next((b for b in data if b["id"] == 18), None)
                
                if booth_17 and booth_18:
                    self.log_test("Get Booths", True, f"Found {len(data)} booths including booth 17 & 18")
                    return True
                else:
                    self.log_test("Get Booths", False, "Missing booth 17 or 18")
                    return False
            else:
                self.log_test("Get Booths", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Booths", False, str(e))
            return False

    def test_get_users(self):
        """Test getting users"""
        try:
            response = requests.get(f"{self.base_url}/users", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else []
            
            if success and len(data) > 0:
                roles = set(user["role"] for user in data)
                expected_roles = {"panna", "admin", "worker", "citizen", "analyst"}
                
                if expected_roles.issubset(roles):
                    self.log_test("Get Users", True, f"Found {len(data)} users with all 5 roles")
                    return data
                else:
                    missing = expected_roles - roles
                    self.log_test("Get Users", False, f"Missing roles: {missing}")
                    return False
            else:
                self.log_test("Get Users", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Users", False, str(e))
            return False

    def test_get_voters(self, booth_id=17):
        """Test getting voters for a booth"""
        try:
            response = requests.get(f"{self.base_url}/voters?booth_id={booth_id}", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else []
            
            if success and len(data) > 0:
                # Check if voters have required fields
                sample_voter = data[0]
                required_fields = ["id", "name", "phone", "sentiment", "booth_id"]
                has_all_fields = all(field in sample_voter for field in required_fields)
                
                if has_all_fields:
                    self.log_test(f"Get Voters (Booth {booth_id})", True, f"Found {len(data)} voters")
                    return data
                else:
                    missing = [f for f in required_fields if f not in sample_voter]
                    self.log_test(f"Get Voters (Booth {booth_id})", False, f"Missing fields: {missing}")
                    return False
            else:
                self.log_test(f"Get Voters (Booth {booth_id})", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test(f"Get Voters (Booth {booth_id})", False, str(e))
            return False

    def test_update_voter_sentiment(self, voter_id=1, sentiment="positive"):
        """Test updating voter sentiment"""
        try:
            payload = {"id": voter_id, "sentiment": sentiment}
            response = requests.patch(f"{self.base_url}/voters", json=payload, timeout=10)
            success = response.status_code == 200
            
            if success:
                self.log_test("Update Voter Sentiment", True, f"Updated voter {voter_id} to {sentiment}")
                return True
            else:
                self.log_test("Update Voter Sentiment", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Update Voter Sentiment", False, str(e))
            return False

    def test_create_call(self, voter_data):
        """Test creating a call log"""
        try:
            payload = {
                "voter_id": voter_data["id"],
                "voter_name": voter_data["name"],
                "status": "answered",
                "notes": "Test call - voter is satisfied with recent improvements",
                "booth_id": voter_data["booth_id"]
            }
            response = requests.post(f"{self.base_url}/calls", json=payload, timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success and "id" in data:
                self.log_test("Create Call", True, f"Created call {data['id']} with sentiment: {data.get('sentiment', 'N/A')}")
                return data
            else:
                self.log_test("Create Call", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Create Call", False, str(e))
            return False

    def test_get_calls(self, booth_id=17):
        """Test getting call history"""
        try:
            response = requests.get(f"{self.base_url}/calls?booth_id={booth_id}", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else []
            
            if success:
                self.log_test(f"Get Calls (Booth {booth_id})", True, f"Found {len(data)} calls")
                return data
            else:
                self.log_test(f"Get Calls (Booth {booth_id})", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test(f"Get Calls (Booth {booth_id})", False, str(e))
            return False

    def test_create_grievance(self, booth_id=17):
        """Test creating a grievance with AI classification"""
        try:
            payload = {
                "description": "The water pump in our area has been broken for 3 days. No water supply to 20 houses. This is urgent and needs immediate attention.",
                "voter_name": "Test Citizen",
                "booth_id": booth_id
            }
            response = requests.post(f"{self.base_url}/grievances", json=payload, timeout=15)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success and "id" in data:
                ai_category = data.get("ai_category", "unknown")
                ai_sentiment = data.get("ai_sentiment", "unknown")
                self.log_test("Create Grievance", True, f"Created grievance {data['id']}, AI classified as: {ai_category}/{ai_sentiment}")
                return data
            else:
                self.log_test("Create Grievance", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Create Grievance", False, str(e))
            return False

    def test_get_grievances(self, booth_id=17):
        """Test getting grievances"""
        try:
            response = requests.get(f"{self.base_url}/grievances?booth_id={booth_id}", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else []
            
            if success:
                self.log_test(f"Get Grievances (Booth {booth_id})", True, f"Found {len(data)} grievances")
                return data
            else:
                self.log_test(f"Get Grievances (Booth {booth_id})", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test(f"Get Grievances (Booth {booth_id})", False, str(e))
            return False

    def test_assign_grievance(self, grievance_id, worker_id="worker-1"):
        """Test assigning a grievance to a worker"""
        try:
            payload = {
                "id": grievance_id,
                "assigned_worker": worker_id,
                "status": "assigned"
            }
            response = requests.patch(f"{self.base_url}/grievances", json=payload, timeout=10)
            success = response.status_code == 200
            
            if success:
                self.log_test("Assign Grievance", True, f"Assigned grievance {grievance_id} to {worker_id}")
                return True
            else:
                self.log_test("Assign Grievance", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Assign Grievance", False, str(e))
            return False

    def test_resolve_grievance(self, grievance_id):
        """Test resolving a grievance"""
        try:
            payload = {
                "id": grievance_id,
                "status": "resolved",
                "resolution_note": "Water pump has been repaired and water supply restored to all affected houses."
            }
            response = requests.patch(f"{self.base_url}/grievances", json=payload, timeout=10)
            success = response.status_code == 200
            
            if success:
                self.log_test("Resolve Grievance", True, f"Resolved grievance {grievance_id}")
                return True
            else:
                self.log_test("Resolve Grievance", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Resolve Grievance", False, str(e))
            return False

    def test_get_analytics(self, booth_id=17):
        """Test getting analytics data"""
        try:
            response = requests.get(f"{self.base_url}/analytics?booth_id={booth_id}", timeout=15)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success and "total_voters" in data:
                insights_count = len(data.get("insights", []))
                self.log_test(f"Get Analytics (Booth {booth_id})", True, 
                            f"Voters: {data['total_voters']}, Issues: {data['total_issues']}, Insights: {insights_count}")
                return data
            else:
                self.log_test(f"Get Analytics (Booth {booth_id})", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test(f"Get Analytics (Booth {booth_id})", False, str(e))
            return False

    def test_full_workflow(self):
        """Test complete workflow: Citizen submit → Admin assign → Worker resolve"""
        print("\n🔄 Testing Full Workflow...")
        
        # Step 1: Citizen submits grievance
        grievance = self.test_create_grievance(booth_id=17)
        if not grievance:
            return False
        
        # Step 2: Admin assigns to worker
        if not self.test_assign_grievance(grievance["id"], "worker-1"):
            return False
        
        # Step 3: Worker resolves issue
        if not self.test_resolve_grievance(grievance["id"]):
            return False
        
        # Step 4: Verify final status
        grievances = self.test_get_grievances(booth_id=17)
        if grievances:
            resolved_grievance = next((g for g in grievances if g["id"] == grievance["id"]), None)
            if resolved_grievance and resolved_grievance["status"] == "resolved":
                self.log_test("Full Workflow", True, "Complete workflow executed successfully")
                return True
        
        self.log_test("Full Workflow", False, "Workflow verification failed")
        return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests for AI-Driven Booth Management System")
        print(f"Base URL: {self.base_url}")
        print("=" * 70)
        
        # Basic connectivity
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Seed data
        self.test_seed_data()
        
        # Test basic endpoints
        self.test_get_booths()
        users = self.test_get_users()
        voters = self.test_get_voters(booth_id=17)
        
        if voters:
            # Test voter operations
            sample_voter = voters[0]
            self.test_update_voter_sentiment(sample_voter["id"], "positive")
            self.test_create_call(sample_voter)
            self.test_get_calls(booth_id=17)
        
        # Test grievance operations
        self.test_get_grievances(booth_id=17)
        
        # Test analytics
        self.test_get_analytics(booth_id=17)
        self.test_get_analytics(booth_id=18)
        
        # Test full workflow
        self.test_full_workflow()
        
        # Print summary
        print("\n" + "=" * 70)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = BoothManagementTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())