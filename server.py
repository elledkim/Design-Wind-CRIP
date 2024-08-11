from flask import Flask, request, jsonify, send_from_directory, render_template, make_response
from flask_cors import CORS
import subprocess
import os
import logging

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

OUTPUT_DIR = os.path.join("R", "generated_csvs")
SCRIPT_DIR = os.path.join(os.getcwd(), "R")

logging.basicConfig(level=logging.DEBUG)

@app.route('/')
def index():
    return render_template('index.html')

# if __name__ == "__main__":
#     app.run(host="0.0.0.0", port=5000, debug=True)


@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json
    risk_category = data.get('riskCategory')
    build_year = data.get('buildYear')
    lifespan = data.get('lifespan')

    # Log for debugging
    logging.debug(f"Received data: {data}")

    r_command = f"Rscript run_designwinds_v2.R {risk_category} {build_year} {lifespan}"
    
    try:
        result = subprocess.run(r_command, capture_output=True, text=True, shell=True, cwd=SCRIPT_DIR)
        logging.debug(f"R script stdout: {result.stdout}")
        logging.error(f"R script stderr: {result.stderr}")
        
        if result.returncode != 0:
            response = make_response(jsonify({"error": result.stderr}), 500)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        
        output_filename = f"US_counties_Gori200_{build_year}_{lifespan}_{risk_category}.csv"

        output_filepath = os.path.join(OUTPUT_DIR, output_filename)
        
        if not os.path.exists(output_filepath):
            response = make_response(jsonify({"error": "CSV file not found"}), 500)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        
        response = make_response(jsonify({"csv_file": output_filename}))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        logging.exception("Exception occurred while running R script")
        response = make_response(jsonify({"error": str(e)}), 500)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

@app.route('/get_csv/<filename>', methods=['GET'])
def get_csv(filename):
    try:
        logging.debug(f"Fetching CSV file: {filename}")
        response = make_response(send_from_directory(OUTPUT_DIR, filename))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        logging.exception(f"Error fetching CSV file: {filename}")
        response = make_response(jsonify({"error": str(e)}), 500)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

if __name__ == '__main__':
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    app.run(debug=True)
