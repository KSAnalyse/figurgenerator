import React, { Component } from 'react';

/* Grid imports*/
import Grid from "@material-ui/core/Grid";

import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import MenuItem from '@material-ui/core/MenuItem';
import Input from "@material-ui/core/Input";

import Box from '@material-ui/core/Box';

/* Endre tittel imports */
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

/* Paper import (brukes til å teste grid) */
import Paper from "@material-ui/core/Paper";

import { Autorenew, Close } from 'mdi-material-ui'

import Figure from './Figure.jsx'

import { withStyles } from '@material-ui/styles';


/* Constants */
import { figureBaseUrl, getMethod, regionInfo } from 'constants'

const styles = theme => ({
    root: {
        display: 'flex',
        padding: '0px 10px 10px 0px',
    },
    paper: {
        
    },
    removeButton: {
        color: 'red',
        width: '33%',
    },
    titleButton: {
        width: '33%',
    },
    swapButton: {
        width: '33%',
    }
  });

class FigureBox extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            figure: [],
            labelWidth: 0,
            figureType: 1   ,
            url: '',
            open: false,
            closed: true,
            titleInput: '',
            pieCompatible: false,
            fetched: false,
        }
        this.inputLabel = React.createRef(null);
        this.titleField = React.createRef();

        this.changeFigureType = this.changeFigureType.bind(this);
        this.figureElement = React.createRef();
        this.removeFigureBox = this.removeFigureBox.bind(this);
        this.changeFigureTitle = this.changeFigureTitle.bind(this);
        this.changeFigureGrouping = this.changeFigureGrouping.bind(this);

        this.handleClose = this.handleClose.bind(this);
        this.handleOpen = this.handleOpen.bind(this);
        this.handleInput = this.handleInput.bind(this);
        
    }

    componentDidMount() {
        const { measures, number, regions, title} = this.props;

        var url = this.createUrl();

        fetch(url, getMethod)
        .then(response => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response.json();
        })
        .then(data => {
            var hcData = this.createCategoryAndSeriesData(data);

            var figureArr = [
                <Figure
                    key={number + ' ' + title}
                    figureType='column'
                    categories={hcData.categories}
                    series={hcData.series}
                    title={title} 
                    ref={this.figureElement}      
                />
            ];
    
            this.setState({
                figure: figureArr,
                figureType: 1,
                fetched: true
            })

        }).catch(error => {
            console.log(error)
        });
    }

    createCategoryAndSeriesData(data) {
        const { measures, regions, years} = this.props;

        var result = {
            series: [],
            categories: [],
        }
        
        //Set categories
        if (years.length === 1 && measures.length !== 1) {
            // Group on regions
            result.categories = Object.keys(data).map(regionNumber => {
                return regionInfo.find(r => parseInt(r.code) === parseInt(regionNumber)).name;
            })
        } else {
            // Group on years
            result.categories = data[parseInt(regions[0])].Years;
        }

        var regionsAsColumns = (measures.length === 1);
        //Set series
        Object.keys(data).map(regionNumber => {
            var regionName = regionInfo.find(r => parseInt(r.code) === parseInt(regionNumber)).name;
            Object.keys(data[regionNumber].Data).map(measureName => {
                var seriesPoint = regionsAsColumns ? result.series.find(s => s.name === regionName): result.series.find(s => s.name === measureName);
                if (seriesPoint === undefined) {
                    result.series.push({
                        name: regionsAsColumns ? regionName: measureName,
                        data: data[regionNumber].Data[measureName]
                    })
                } else {
                    seriesPoint.data.push(data[regionNumber].Data[measureName][0]);
                }
            });
        });
        
        return result;
    }

    createUrl() {
        const { measures, regions, years } = this.props;

        var urlMeasures = measures.map(measureName => {
            var newName = measureName.replace(/\ /g, '%20');
            newName.replace(/æ/g, '%C3%A6')
            newName.replace(/ø/g, '%C3%B8')
            newName.replace(/å/g, '%C3%A5')

            return newName;
        });

        var datasetsQuery = '?datasett=' + urlMeasures.sort();
        var yearsQuery = '&årstall=' + years.sort();
        var regionsQuery = '&regioner=' + regions.sort();

        return figureBaseUrl + datasetsQuery + regionsQuery + yearsQuery;
    }

    changeFigureType(value) {
        console.log('Changing figure type from ' + this.state.figureType + ' to ' + value)
        var type = '';

        if (this.state.figureType === value)
            return;

        switch(value) {
            case 1:
                type = 'column';
                break;
            case 2:
                type = 'line';
                break;
            case 3:
                type = 'bar';
                break;
            case 4:
                type = 'pie';
                break;

        }
        
        this.figureElement.current.changeFigureType(type);
        this.setState({
            figureType: value
        });
    }

    removeFigureBox() {
        this.setState({
            figure: null
        });

        this.props.removeFigureBox(this.props.id);
    }

    changeFigureTitle(event) {
        const { titleInput } = this.state;

        this.figureElement.current.changeTitle(titleInput);

        this.handleClose();
    }

    changeFigureGrouping(event) {
        this.figureElement.current.swapGrouping();
    }

    handleClose() {
        this.setState({
            open: false
        });
    }

    handleOpen() {
        this.setState({
            open: true
        });
    }

    handleInput(event) {
        this.setState({
            titleInput: event.target.value
        });
    }

    render() {
        const { figureType, fetched } = this.state;
        const { classes } = this.props;
        return(
            fetched ? 
            <div className={classes.root}>
                <Paper className={classes.paper}>
                       
                    <InputLabel ref={this.inputLabel} htmlFor="outlined-age-simple">
                        Figurtype
                    </InputLabel>
                    <Select
                        name='figuretype'
                        value={figureType}
                        onChange={event => this.changeFigureType(event.target.value)}
                        fullWidth={true}
                    >
                        <MenuItem key='columnItem' value={1}>Kolonne</MenuItem>
                        <MenuItem key='lineItem' value={2}>Linje</MenuItem>
                        <MenuItem key='barItem' value={3}>Stolpe</MenuItem>
                        <MenuItem key='pieItem' disabled value={4}>Pai</MenuItem>
                    </Select>
                    {this.state.figure}
                    <Button className={classes.titleButton} onClick={this.handleOpen} >Endre tittel</Button>
                    <Button className={classes.swapButton} onClick={this.changeFigureGrouping}><Autorenew/></Button>
                    <Button className={classes.removeButton} onClick={this.removeFigureBox}>Fjern figur<Close /></Button>
                    <Dialog open={this.state.open} onClose={this.handleClose} aria-labelledby="form-dialog-title">
                        <DialogTitle id="form-dialog-title">Endre tittel</DialogTitle>
                        <DialogContent>
                            <TextField
                                ref={this.titleField}
                                onChange={this.handleInput}
                                autoFocus
                                margin="dense"
                                id="name"
                                label="Ny tittel"
                                type="email"
                                fullWidth
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={this.handleClose} color="primary">
                                Avbryt
                            </Button>
                            <Button onClick={this.changeFigureTitle} color="primary">
                                Endre
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Paper>
            </div>
            : null
        );
    }
}

export default withStyles(styles)(FigureBox);